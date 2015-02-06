'use strict';

R = require('ramda')

href = window.location.href
isPRs = href.indexOf('/pulls') >= 0
isPRDetail = href.indexOf('/pull/') >= 0

## .. Model type ..
# CommentData :: { username: Str, userid: Str, isApprove: Bool }
# Comment :: Maybe CommentData

# :: Element -> [Comment]
# Parse an element containing PR detail into a list of comment that is approving the PR
parsePR = (elem) -> 
  timeline = getTimeline()
  comments = R.map(parseComment, timeline)
  commentsAfterLatestCommit = R.foldl(((acc, x) -> if not x then acc else [].concat(acc)), [], comments)
  onlyApproveComments = R.filter(((x) -> x.isApprove), commentsAfterLatestCommit)

commentSelector = '.timeline-comment-wrapper:not(.timeline-new-comment)'
commitSelector = '.discussion-commits'
getTimeline = () -> document.querySelectorAll(R.join(', ', [commentSelector, commitSelector]))
isCommentElem = (elem) -> elem.classList.contains('timeline-comment-wrapper')
parseComment = (elem) ->
  if not isCommentElem(elem)
    null
  else
    comment = elem.querySelector('div.comment-body.js-comment-body').innerHTML
    {
      username: elem.querySelector('a').getAttribute('href').substr(1),
      userid: elem.querySelector('a > img').getAttribute('data-user'),
      isApprove: comment.indexOf('+1') >= 0
    }


## .. UI Function for PR detail ..
# :: elem, [Comment] -> ()
augmentPRdetail = (elem, comments) ->
  c = PRD_getBaseContainer(elem)
  c.insertBefore(PRD_ui(elem, comments), c.firstChild)

PRD_getBaseContainer = (elem) -> elem.querySelector('div.discussion-sidebar')
PRD_getBaseItem = (elem) -> elem.querySelector('div#partial-users-participants')
PRD_getBaseAvatar = (elem) -> elem.querySelector('a.participant-avatar')
PRD_avatar = R.curry((elem, model) -> 
  ret = PRD_getBaseAvatar(elem).cloneNode(true)
  ret.setAttribute('aria-label', model.username)
  ret.setAttribute('href', '/' + model.username)
  ret.querySelector('img').setAttribute('src', getProfpicUrl(40, model.userid))
  ret
)
PRD_ui = (elem, models) ->
  item = PRD_getBaseItem(elem).cloneNode(true)
  item.setAttribute('id', 'partial-users-approvers')
  item.querySelector('h3').innerHTML = models.length + ' approvers'
  
  avatars = R.map(PRD_avatar(item), models)
  avatarContainer = item.querySelector('div.participation-avatars')
  avatarContainer.removeChild(avatarContainer.firstChild) while (avatarContainer.firstChild)
  avatarContainer.appendChild(avatarUI) for avatarUI in avatars
  item

## .. UI Function for PR list ..
augmentPRList = (comments) -> null

## Utitlities UI Func
getProfpicUrl = (size, userid) -> 'https://avatars2.githubusercontent.com/u/' + userid + '?v=3&s=' + size;


## main

model = parsePR(document)
console.log(model)
augmentPRdetail(document, model)
