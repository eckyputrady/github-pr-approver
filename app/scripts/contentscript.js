(function() {
  'use strict';
  var R, approver, avatar, baseAvatar, baseItem, commentAndCommitElems, commentAndCommitModels, commentSelector, commitSelector, containClasses, container, foldF, getProfpicUrl, href, isComment, isCommit, isPRDetail, isPRs, parseComment, test2, updateApprovers;

  R = require('ramda');

  href = window.location.href;

  isPRs = href.indexOf('/pulls') >= 0;

  isPRDetail = href.indexOf('/pull/') >= 0;

  commentSelector = '.timeline-comment-wrapper:not(.timeline-new-comment)';

  commitSelector = '.discussion-commits';

  commentAndCommitElems = function() {
    return document.querySelectorAll(R.join(', ', [commentSelector, commitSelector]));
  };

  containClasses = R.curry(function(xs, elem) {
    return R.all((function(x) {
      return elem.classList.contains(x);
    }), xs);
  });

  isComment = containClasses(['timeline-comment-wrapper']);

  isCommit = containClasses(['discussion-commits']);

  parseComment = function(elem) {
    var comment;
    if (!isComment(elem)) {
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

  foldF = function(acc, val) {
    if (!val) {
      return acc;
    } else if (!val.isApprove) {
      return acc;
    } else {
      acc.push(val);
      return acc;
    }
  };

  getProfpicUrl = function(size, userid) {
    return 'https://avatars2.githubusercontent.com/u/' + userid + '?v=3&s=' + size;
  };

  baseItem = function() {
    return document.querySelector('div#partial-users-participants');
  };

  container = function() {
    return document.querySelector('div.discussion-sidebar');
  };

  baseAvatar = function(item) {
    return item.querySelector('a.participant-avatar');
  };

  avatar = R.curry(function(item, model) {
    var ret;
    console.log(item);
    ret = baseAvatar(item).cloneNode(true);
    ret.setAttribute('aria-label', model.username);
    ret.setAttribute('href', '/' + model.username);
    ret.querySelector('img').setAttribute('src', getProfpicUrl(40, model.userid));
    return ret;
  });

  approver = function(models) {
    var avatarContainer, avatarUI, avatars, item, _i, _len;
    item = baseItem().cloneNode(true);
    item.setAttribute('id', 'partial-users-approvers');
    item.querySelector('h3').innerHTML = models.length + ' approvers';
    avatars = R.map(avatar(item), models);
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

  updateApprovers = function(models) {
    var c;
    c = container();
    return c.insertBefore(approver(models), c.firstChild);
  };

  commentAndCommitModels = R.map(parseComment, commentAndCommitElems());

  test2 = R.foldl(foldF, [], commentAndCommitModels);

  console.log(test2);

  updateApprovers(test2);

}).call(this);
