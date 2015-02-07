'use strict';

R = require('ramda')
$ = require('jquery')
approveWords = [
  ':+1:'
  ':shipit:'
  'verified'
  'next ma jo'
  'approve'
]

## .. Model type ..
# CommentData :: { elem: Element, username: Str, userid: Str, isApprove: Bool }
# Comment :: Maybe CommentData
# Excerpt :: { id: Str, url: Str, cmt: [Comment] }

# :: Element -> [Comment]
# Parse an element containing PR detail into a list of comment that is approving the PR
parsePRD = (elem) -> 
  timeline = getTimeline(elem)
  comments = R.map(parseComment, timeline)
  commentsAfterLatestCommit = R.foldl(((acc, x) -> if not x then [] else [x].concat(acc)), [], comments)
  onlyApproveComments = R.filter(((x) -> x.isApprove), commentsAfterLatestCommit)

commentSelector = '.timeline-comment-wrapper:not(.timeline-new-comment)'
commitSelector = '.discussion-commits'
getTimeline = (elem) -> elem.querySelectorAll(R.join(', ', [commentSelector, commitSelector]))
isCommentElem = (elem) -> elem.classList.contains('timeline-comment-wrapper')
parseComment = (elem) ->
  if not isCommentElem(elem)
    null
  else
    comment = elem.querySelector('div.comment-body.js-comment-body').innerHTML
    {
      elem: elem
      username: elem.querySelector('a').getAttribute('href').substr(1)
      userid: elem.querySelector('a > img').getAttribute('data-user')
      isApprove: isApprove(comment.toLowerCase())
    }
isApprove = (comment) ->
  f = (x) -> comment.indexOf(x) >= 0
  R.any(f, approveWords)

# :: Element -> [Excerpt]
# Parse an element containing PR list into a list of Excerpt
parsePRL = (elem) -> 
  R.map(parseExcerpt, getIssuesElem(elem))

getIssuesElem = (elem) -> elem.querySelectorAll('div.issues-listing > ul > li')
getIssueId = (elem) -> elem.getAttribute('data-issue-id')
getIssueUrl = (elem) -> elem.querySelector('.issue-title > a').getAttribute('href')
parseExcerpt = (elem) -> 
  url = getIssueUrl(elem)
  issueId = getIssueId(elem)
  getUrl = () -> $.get(url)
  stringToElement = (str) -> (new DOMParser()).parseFromString(str, 'text/html')
  retry(getUrl).then(stringToElement).then(parsePRD).then((cmt) -> { id: issueId, url: url, cmt: cmt })
retry = (pFunc) ->
  pFunc().fail(pFunc).fail(pFunc).fail(pFunc)


## .. UI Function for PR detail ..
# :: Element, [Comment] -> ()
augmentPRD = (elem, comments) ->
  c = PRD_getBaseContainer(elem)
  c.insertBefore(PRD_ui(elem, comments), c.firstChild)
  R.forEach(augmentComment, comments)
checkPRDFinishCond = (elem) ->
  elem.querySelectorAll('#partial-users-approves').length > 0
augmentComment = (comment) ->
  msg = "#{comment.username} approves this PR via this comment"
  comment.elem.querySelector('div.timeline-comment-header-text').innerHTML += 
    """
    <span class="issue-pr-status">
      <div>
        <a class="status status-success tooltipped tooltipped-e" aria-label="#{msg}">
          <span class="octicon octicon-check"></span>
        </a>
      </div>
    </span>
    """

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
  item.setAttribute('id', 'partial-users-approves')
  item.querySelector('h3').innerHTML = models.length + ' approves'
  
  avatars = R.map(PRD_avatar(item), models)
  avatarContainer = item.querySelector('div.participation-avatars')
  avatarContainer.removeChild(avatarContainer.firstChild) while (avatarContainer.firstChild)
  avatarContainer.appendChild(avatarUI) for avatarUI in avatars
  item

## .. UI Function for PR list ..
# :: Element, [Excerpt] -> ()
augmentPRL = (elem, excerpts) -> 
  applyEffect = (excerptPromise) ->
    excerptPromise.then(augmentPRLItem(elem))
  R.forEach(applyEffect, excerpts)
checkPRLFinishCond = (elem) ->
  elem.querySelectorAll('#PRL_ui').length > 0

augmentPRLItem = R.curry((elem, excerpt) ->
  container = PRL_getContainer(elem, excerpt)
  container.setAttribute('style', 'width:32px')
  container.innerHTML = PRL_icon(excerpt)
)
PRL_getContainer = (elem, excerpt) -> 
  elem.querySelector('li#issue_' + excerpt.id).querySelector('div.table-list-cell-avatar')
PRL_icon = (excerpt) ->
  """
  <a id="PRL_ui" href="#{excerpt.url}" aria-label="#{PRL_wording(excerpt)}" class="muted-link tooltipped tooltipped-e">
    <span class="octicon octicon-check"></span> #{excerpt.cmt.length}
  </a>
  """ 
PRL_wording = (excerpt) ->
  len = excerpt.cmt.length
  getUsername = (x) -> x.username
  names = R.take(2, R.map(getUsername, excerpt.cmt))
  if len <= 0
    'Nobody has approved this PR yet'
  else if len <= 2
    R.join(' and ', names) + ' has approved this PR'
  else
    R.join(', ', names) + 'and ' + (len-2) + ' others has approved this PR'


## Utilities UI Func
getProfpicUrl = (size, userid) -> 'https://avatars2.githubusercontent.com/u/' + userid + '?v=3&s=' + size;


## main
lastHref = null
main = () ->
  href = window.location.href
  isPRL = href.indexOf('/pulls') >= 0
  isPRD = href.indexOf('/pull/') >= 0
  if isPRL
    PRL(document)
  else if isPRD
    PRD(document)
  else
    console.log('Ooops! I dont know how to handle ' + href)

PRL = (elem) ->
  augmentPRL(elem, parsePRL(elem)) if not checkPRLFinishCond(elem)
PRD = (elem) ->
  augmentPRD(elem, parsePRD(elem)) if not checkPRDFinishCond(elem)

setInterval(main, 3000)
main()