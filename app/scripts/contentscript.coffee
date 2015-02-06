'use strict';

R = require('ramda')

href = window.location.href
isPRs = href.indexOf('/pulls') >= 0
isPRDetail = href.indexOf('/pull/') >= 0

commentSelector = '.timeline-comment-wrapper:not(.timeline-new-comment)'
commitSelector = '.discussion-commits'

commentAndCommitElems = () -> document.querySelectorAll(R.join(', ', [commentSelector, commitSelector]))
containClasses = R.curry((xs, elem) -> R.all(((x) -> elem.classList.contains(x)), xs)) 
isComment = containClasses(['timeline-comment-wrapper'])
isCommit = containClasses(['discussion-commits'])

parseComment = (elem) ->
  if not isComment(elem)
    null
  else
    comment = elem.querySelector('div.comment-body.js-comment-body').innerHTML
    {
      username: elem.querySelector('a').getAttribute('href').substr(1),
      userid: elem.querySelector('a > img').getAttribute('data-user'),
      isApprove: comment.indexOf('+1') >= 0
    }

foldF = (acc, val) ->
  if not val
    []
  else if not val.isApprove
    acc
  else
    acc.push(val)
    acc

getProfpicUrl = (size, userid) -> 'https://avatars2.githubusercontent.com/u/' + userid + '?v=3&s=' + size;
baseItem = () -> document.querySelector('div#partial-users-participants')
container = () -> document.querySelector('div.discussion-sidebar')
baseAvatar = (item) -> item.querySelector('a.participant-avatar')
avatar = R.curry((item, model) -> 
  console.log(item)
  ret = baseAvatar(item).cloneNode(true)
  ret.setAttribute('aria-label', model.username)
  ret.setAttribute('href', '/' + model.username)
  ret.querySelector('img').setAttribute('src', getProfpicUrl(40, model.userid))
  ret
)
approver = (models) ->
  item = baseItem().cloneNode(true)
  item.setAttribute('id', 'partial-users-approvers')
  item.querySelector('h3').innerHTML = models.length + ' approvers'
  
  avatars = R.map(avatar(item), models)
  avatarContainer = item.querySelector('div.participation-avatars')
  avatarContainer.removeChild(avatarContainer.firstChild) while (avatarContainer.firstChild)
  avatarContainer.appendChild(avatarUI) for avatarUI in avatars
  item

updateApprovers = (models) ->
  c = container()
  c.insertBefore(approver(models), c.firstChild)

commentAndCommitModels = R.map(parseComment, commentAndCommitElems())

test2 = R.foldl(foldF, [], commentAndCommitModels)

console.log(test2);
updateApprovers(test2)
