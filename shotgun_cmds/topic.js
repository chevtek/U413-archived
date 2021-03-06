exports.roles = 'user';

exports.description = "Displays the specified topic and all replies.";

exports.usage = "<id> [options]";

exports.options = {
    id: {
        noName: true,
        required: true,
        prompt: "Enter the ID of the topic you want to view.",
        validate: /^\d+$/,
        hidden: true
    },
    last: {
        default: false,
        description: "Jump to the most recent comment."
    }
};

exports.invoke = function(shell, options) {
    // Display topic.
    shell.db.Topic
        .findById(options.id)
        .populate('creator editedBy')
        .exec(function (err, topic) {
            if (err) return shell.error(err);
            if (!topic) return shell.error("There is no topic {{0}}.".format(options.id));
            shell.setVar('lastTopic', options.id);
            shell.clearDisplay();
            shell.db.Comment
                .find({ topic: topic.id })
                .populate('creator editedBy')
                .sort('date')
                .exec(function (err, comments) {
                    var currentUser = shell.getVar('currentUser'),
                        hasViewed = false;
                    for (var index = 0; index < topic.views.length; index++) {
                        var view = topic.views[index];
                        if (view.userId == currentUser._id) {
                            hasViewed = true;
                            view.commentCount = comments.length;
                            break;
                        }
                    }
                    if (!hasViewed)
                        topic.views.push({
                            userId: currentUser._id,
                            commentCount: comments.length
                        });
                    topic.save(function (err) {
                        if (err) return shell.error(err);
                        shell.view('topic', { topic: topic, comments: comments });
                    });
                });
        });
};