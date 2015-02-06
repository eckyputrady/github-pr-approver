(function() {
  'use strict';
  var PRD_avatar, PRD_getBaseAvatar, PRD_getBaseContainer, PRD_getBaseItem, PRD_ui, R, augmentPRList, augmentPRdetail, commentSelector, commitSelector, getProfpicUrl, getTimeline, href, isCommentElem, isPRDetail, isPRs, model, parseComment, parsePR;

  R = require('ramda');

  href = window.location.href;

  isPRs = href.indexOf('/pulls') >= 0;

  isPRDetail = href.indexOf('/pull/') >= 0;

  parsePR = function(elem) {
    var comments, commentsAfterLatestCommit, onlyApproveComments, timeline;
    timeline = getTimeline();
    comments = R.map(parseComment, timeline);
    commentsAfterLatestCommit = R.foldl((function(acc, x) {
      if (!x) {
        return acc;
      } else {
        return [].concat(acc);
      }
    }), [], comments);
    return onlyApproveComments = R.filter((function(x) {
      return x.isApprove;
    }), commentsAfterLatestCommit);
  };

  commentSelector = '.timeline-comment-wrapper:not(.timeline-new-comment)';

  commitSelector = '.discussion-commits';

  getTimeline = function() {
    return document.querySelectorAll(R.join(', ', [commentSelector, commitSelector]));
  };

  isCommentElem = function(elem) {
    return elem.classList.contains('timeline-comment-wrapper');
  };

  parseComment = function(elem) {
    var comment;
    if (!isCommentElem(elem)) {
      return null;
    } else {
      comment = elem.querySelector('div.comment-body.js-comment-body').innerHTML;
      return {
        username: elem.querySelector('a').getAttribute('href').substr(1),
        userid: elem.querySelector('a > img').getAttribute('data-user'),
        isApprove: comment.indexOf('+1') >= 0
      };
    }
  };

  augmentPRdetail = function(elem, comments) {
    var c;
    c = PRD_getBaseContainer(elem);
    return c.insertBefore(PRD_ui(elem, comments), c.firstChild);
  };

  PRD_getBaseContainer = function(elem) {
    return elem.querySelector('div.discussion-sidebar');
  };

  PRD_getBaseItem = function(elem) {
    return elem.querySelector('div#partial-users-participants');
  };

  PRD_getBaseAvatar = function(elem) {
    return elem.querySelector('a.participant-avatar');
  };

  PRD_avatar = R.curry(function(elem, model) {
    var ret;
    ret = PRD_getBaseAvatar(elem).cloneNode(true);
    ret.setAttribute('aria-label', model.username);
    ret.setAttribute('href', '/' + model.username);
    ret.querySelector('img').setAttribute('src', getProfpicUrl(40, model.userid));
    return ret;
  });

  PRD_ui = function(elem, models) {
    var avatarContainer, avatarUI, avatars, item, _i, _len;
    item = PRD_getBaseItem(elem).cloneNode(true);
    item.setAttribute('id', 'partial-users-approvers');
    item.querySelector('h3').innerHTML = models.length + ' approvers';
    avatars = R.map(PRD_avatar(item), models);
    avatarContainer = item.querySelector('div.participation-avatars');
    while (avatarContainer.firstChild) {
      avatarContainer.removeChild(avatarContainer.firstChild);
    }
    for (_i = 0, _len = avatars.length; _i < _len; _i++) {
      avatarUI = avatars[_i];
      avatarContainer.appendChild(avatarUI);
    }
    return item;
  };

  augmentPRList = function(comments) {
    return null;
  };

  getProfpicUrl = function(size, userid) {
    return 'https://avatars2.githubusercontent.com/u/' + userid + '?v=3&s=' + size;
  };

  model = parsePR(document);

  console.log(model);

  augmentPRdetail(document, model);

}).call(this);
