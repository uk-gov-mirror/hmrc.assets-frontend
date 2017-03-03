var test = require('tape')
var sinon = require('sinon')
var gutil = require('gulp-util')
var proc = require('child_process')
var changelog = require('../tasks/changelog')

test('changelog - runCommand', function (t) {
  t.plan(2)

  changelog.runCommand()
    .catch(function (data) {
      t.ok(data instanceof Error, 'returns an Error if the command fails')
    })

  changelog.runCommand('echo "test"')
    .then(function (command) {
      t.equal(command, 'test\n', 'should return a Promise if given a command to run')
    })
})

test('changelog - getCurrentCommit', function (t) {
  t.plan(5)

  var sha = 'abcd123'
  var execStub = sinon.stub(proc, 'exec').callsArgWith(1, null, sha, null)

  var givenCommit = changelog.getCurrentCommit(sha)
  var currentCommit = changelog.getCurrentCommit()

  t.ok(givenCommit.then(), 'returns a Promise when given a commit sha')
  t.ok(currentCommit.then(), 'returns a Promise when not given a commit sha')
  t.ok(execStub.calledOnce, 'only calls git when not given a commit sha')

  givenCommit.then(function (branch) {
    t.equal(branch, sha, 'returns the result of git exactly when given a sha')
  })

  currentCommit.then(function (branch) {
    t.equal(branch, sha, 'returns the result of git exactly when not given a sha')
  })

  proc.exec.restore()
})

test('changelog - getChangedFiles', function (t) {
  t.plan(3)

  var files = 'file-one.html\n' +
    'file-two.js\n' +
    'file-three'

  sinon.stub(gutil, 'log')
  sinon.stub(proc, 'exec').callsArgWith(1, null, files, null)

  var noBranch = changelog.getChangedFiles()
  var changedFiles = changelog.getChangedFiles('test')

  noBranch.catch(function (err) {
    t.ok(err instanceof Error, 'throws an error when not given a branch')
  })

  t.ok(changedFiles.then(), 'returns a Promise when given a branch')

  changedFiles.then(function (value) {
    t.equal(value, files, 'returns the Promise value exactly')
  })

  gutil.log.restore()
  proc.exec.restore()
})

test('changelog - checkForChangelog', function (t) {
  t.plan(2)

  var files = 'file-one.html\n' +
    'CHANGELOG.md\n' +
    'file-three'

  sinon.stub(gutil, 'log')

  t.true(
    changelog.checkForChangelog(files),
    'returns true when CHANGELOG.md is found'
  )

  changelog.checkForChangelog('CHANGELOG')
    .catch(function (err) {
      t.ok(err instanceof Error, 'returns an Error when CHANGELOG.md cannot be found')
    })

  gutil.log.restore()
})
