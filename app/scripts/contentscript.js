(function() {
  'use strict';
  var $, PRD, PRD_avatar, PRD_getBaseAvatar, PRD_getBaseContainer, PRD_getBaseItem, PRD_ui, PRL, PRL_getContainer, PRL_icon, PRL_wording, R, approveWords, augmentPRD, augmentPRL, augmentPRLItem, checkPRDFinishCond, checkPRLFinishCond, commentSelector, commitSelector, getIssueId, getIssueUrl, getIssuesElem, getProfpicUrl, getTimeline, isApprove, isCommentElem, lastHref, main, parseComment, parseExcerpt, parsePRD, parsePRL, retry;

  R = require('ramda');

  $ = require('jquery');

  approveWords = [':+1:', ':shipit:', 'verified', 'next ma jo', 'approve'];

  parsePRD = function(elem) {
    var comments, commentsAfterLatestCommit, onlyApproveComments, timeline;
    timeline = getTimeline(elem);
    comments = R.map(parseComment, timeline);
    commentsAfterLatestCommit = R.foldl((function(acc, x) {
      if (!x) {
        return [];
      } else {
        return [x].concat(acc);
      }
    }), [], comments);
    return onlyApproveComments = R.filter((function(x) {
      return x.isApprove;
    }), commentsAfterLatestCommit);
  };

  commentSelector = '.timeline-comment-wrapper:not(.timeline-new-comment)';

  commitSelector = '.discussion-commits';

  getTimeline = function(elem) {
    return elem.querySelectorAll(R.join(', ', [commentSelector, commitSelector]));
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
        isApprove: isApprove(comment.toLowerCase())
      };
    }
  };

  isApprove = function(comment) {
    var f;
    f = function(x) {
      return comment.indexOf(x) >= 0;
    };
    return R.any(f, approveWords);
  };

  parsePRL = function(elem) {
    return R.map(parseExcerpt, getIssuesElem(elem));
  };

  getIssuesElem = function(elem) {
    return elem.querySelectorAll('div.issues-listing > ul > li');
  };

  getIssueId = function(elem) {
    return elem.getAttribute('data-issue-id');
  };

  getIssueUrl = function(elem) {
    return elem.querySelector('.issue-title > a').getAttribute('href');
  };

  parseExcerpt = function(elem) {
    var getUrl, issueId, stringToElement, url;
    url = getIssueUrl(elem);
    issueId = getIssueId(elem);
    getUrl = function() {
      return $.get(url);
    };
    stringToElement = function(str) {
      return (new DOMParser()).parseFromString(str, 'text/html');
    };
    return retry(getUrl).then(stringToElement).then(parsePRD).then(function(cmt) {
      return {
        id: issueId,
        url: url,
        cmt: cmt
      };
    });
  };

  retry = function(pFunc) {
    return pFunc().fail(pFunc).fail(pFunc).fail(pFunc);
  };

  augmentPRD = function(elem, comments) {
    var c;
    c = PRD_getBaseContainer(elem);
    return c.insertBefore(PRD_ui(elem, comments), c.firstChild);
  };

  checkPRDFinishCond = function(elem) {
    return elem.querySelectorAll('#partial-users-approves').length > 0;
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

  augmentPRL = function(elem, excerpts) {
    var applyEffect;
    applyEffect = function(excerptPromise) {
      return excerptPromise.then(augmentPRLItem(elem));
    };
    return R.forEach(applyEffect, excerpts);
  };

  checkPRLFinishCond = function(elem) {
    return elem.querySelectorAll('#PRL_ui').length > 0;
  };

  augmentPRLItem = R.curry(function(elem, excerpt) {
    var container;
    container = PRL_getContainer(elem, excerpt);
    container.setAttribute('style', 'width:32px');
    return container.innerHTML = PRL_icon(excerpt);
  });

  PRL_getContainer = function(elem, excerpt) {
    return elem.querySelector('li#issue_' + excerpt.id).querySelector('div.table-list-cell-avatar');
  };

  PRL_icon = function(excerpt) {
    return "<a id=\"PRL_ui\" href=\"" + excerpt.url + "\" aria-label=\"" + (PRL_wording(excerpt)) + "\" class=\"muted-link tooltipped tooltipped-e\">\n  <span class=\"octicon octicon-check\"></span> " + excerpt.cmt.length + "\n</a>";
  };

  PRL_wording = function(excerpt) {
    var getUsername, len, names;
    len = excerpt.cmt.length;
    getUsername = function(x) {
      return x.username;
    };
    names = R.take(2, R.map(getUsername, excerpt.cmt));
    if (len <= 0) {
      return 'Nobody has approved this PR yet';
    } else if (len <= 2) {
      return R.join(' and ', names) + ' has approved this PR';
    } else {
      return R.join(', ', names) + 'and ' + (len - 2) + ' others has approved this PR';
    }
  };

  getProfpicUrl = function(size, userid) {
    return 'https://avatars2.githubusercontent.com/u/' + userid + '?v=3&s=' + size;
  };

  lastHref = null;

  main = function() {
    var href, isPRD, isPRL;
    href = window.location.href;
    isPRL = href.indexOf('/pulls') >= 0;
    isPRD = href.indexOf('/pull/') >= 0;
    if (isPRL) {
      return PRL(document);
    } else if (isPRD) {
      return PRD(document);
    } else {
      return console.log('Ooops! I dont know how to handle ' + href);
    }
  };

  PRL = function(elem) {
    if (!checkPRLFinishCond(elem)) {
      return augmentPRL(elem, parsePRL(elem));
    }
  };

  PRD = function(elem) {
    if (!checkPRDFinishCond(elem)) {
      return augmentPRD(elem, parsePRD(elem));
    }
  };

  setInterval(main, 3000);

  main();

}).call(this);
