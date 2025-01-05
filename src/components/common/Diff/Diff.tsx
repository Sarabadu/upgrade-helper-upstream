import React, { useState, useCallback, useEffect } from 'react'
import styled from '@emotion/styled'
import {
  Diff as RDiff,
  Hunk,
  markEdits,
  tokenize,
  Decoration as DiffDecoration,
} from 'react-diff-view'
import { Button, Card, Typography } from 'antd'
import DiffHeader from './DiffHeader'
import { getComments } from './DiffComment'
import { useReleases } from '../../../ReleaseProvider'
import { replaceAppDetails } from '../../../utils'
import type { Theme } from '../../../theme'

const copyPathPopoverContentOpts = {
  default: 'Click to copy file path',
  copied: 'File path copied!',
}

const Container = styled.div<{ theme?: Theme }>`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 3px;
  margin-bottom: 16px;
  margin-top: 16px;
  color: ${({ theme }) => theme.text};
`

const More = styled.div`
  margin-left: 30px;
  padding-left: 4px;
`

const Decoration = styled(DiffDecoration)`
  background-color: ${({ theme }) => theme.diff.decorationContentBackground};
  color: ${({ theme }) => theme.diff.decorationContent};
`

const DiffView = styled(RDiff)`
  .diff-gutter-col {
    width: 30px;
  }

  tr.diff-line {
    font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier,
      monospace;
  }

  td.diff-gutter .diff-line-normal {
    background-color: ${({ theme }) => theme.gutterInsertBackground};
    border-color: ${({ theme }) => theme.greenBorder};
  }

  td.diff-gutter:hover {
    cursor: pointer;
    color: ${({ theme }) => theme.textHover};
  }

  td.diff-code {
    font-size: 12px;
    color: ${({ theme }) => theme.text};
  }

  td.diff-gutter-omit:before {
    width: 0;
    background-color: transparent;
  }

  td.diff-widget-content {
    padding: 0;
  }

  // From diff global
  .diff {
    background-color: ${({ theme }) => theme.diff.backgroundColor};
    color: ${({ theme }) => theme.diff.text};
    tab-size: 4;
    hyphens: none;
  }

  .diff::selection {
    background-color: ${({ theme }) => theme.diff.selectionMackground};
  }

  .diff-decoration {
    line-height: 2;
    font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier,
      monospace;
    background-color: ${({ theme }) => theme.diff.decorationBackground};
  }

  .diff-decoration-content {
    padding-left: 0.5em;
    background-color: ${({ theme }) => theme.diff.contentBackground};
    color: ${({ theme }) => theme.diff.decorationContent};
  }

  .diff-gutter {
    padding: 0;
    text-align: center;
    font-size: 12px;
    cursor: auto;
  }

  .diff-gutter-insert {
    background-color: ${({ theme }) => theme.diff.gutterInsertBackground};
  }

  .diff-gutter-delete {
    background-color: ${({ theme }) => theme.diff.gutterDeleteBackground};
  }

  .diff-gutter-selected {
    background-color: ${({ theme }) => theme.diff.gutterSelectedBackground};
  }

  .diff-code-insert {
    background-color: ${({ theme }) => theme.diff.codeInsertBackground};
  }

  .diff-code-edit {
    color: inherit;
  }

  .diff-code-insert .diff-code-edit {
    background-color: ${({ theme }) => theme.diff.codeInsertEditBackground};
  }

  .diff-code-delete {
    background-color: ${({ theme }) => theme.diff.codeDeleteBackground};
  }

  .diff-code-delete .diff-code-edit {
    background-color: ${({ theme }) => theme.diff.codeDeleteEditBackground};
  }

  .diff-code-selected {
    background-color: ${({ theme }) => theme.diff.codeSelectedBackground};
  }

  .diff-decoration-gutter {
    background-color: ${({ theme }) => theme.diff.decorationGutterBackground};
    color: ${({ theme }) => theme.diff.decorationGutter};
  }
`

// Diff will be collapsed by default if the file has been deleted or has more than 5 hunks
const isDiffCollapsedByDefault = ({ type, hunks }) =>
  type === 'delete' || hunks.length > 5 ? true : undefined

const Placeholder = ({ newPath, children }) => {
  const [showDiff, setShowDiff] = useState(false)

  if (!showDiff && newPath === '.yarn/plugins/@yarnpkg/plugin-backstage.cjs') {
    return (
      <Card
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          rowGap: '10px'
        }}
      >
        <Button onClick={() => setShowDiff(true)}>Show diff</Button>
        <Typography>
          The diff for the Backstage yarn plugin is hidden by default.
        </Typography>
      </Card>
    )
  }

  return children
}

const Diff = ({
  packageName,
  oldPath,
  newPath,
  type,
  hunks,
  fromVersion,
  toVersion,
  diffKey,
  isDiffCompleted,
  onCompleteDiff,
  selectedChanges,
  onToggleChangeSelection,
  areAllCollapsed,
  setAllCollapsed,
  diffViewStyle,
  appName,
  appPackage,
}) => {
  const [isDiffCollapsed, setIsDiffCollapsed] = useState(
    isDiffCollapsedByDefault({ type, hunks })
  )

  const [copyPathPopoverContent, setCopyPathPopoverContent] = useState(
    copyPathPopoverContentOpts.default
  )

  const handleCopyPathToClipboard = () => {
    setCopyPathPopoverContent(copyPathPopoverContentOpts.copied)
  }

  const handleResetCopyPathPopoverContent = () => {
    if (copyPathPopoverContent === copyPathPopoverContentOpts.copied) {
      setCopyPathPopoverContent(copyPathPopoverContentOpts.default)
    }
  }

  const getHunksWithAppName = useCallback(
    (originalHunks) => {
      if (!appName && !appPackage) {
        // No patching of rn-diff-purge output required.
        return originalHunks
      }

      return originalHunks.map((hunk) => ({
        ...hunk,
        changes: hunk.changes.map((change) => ({
          ...change,
          content: replaceAppDetails(change.content, appName, appPackage),
        })),
        content: replaceAppDetails(hunk.content, appName, appPackage),
      }))
    },
    [appName, appPackage]
  )

  useEffect(() => {
    if (areAllCollapsed !== undefined && areAllCollapsed !== isDiffCollapsed) {
      setIsDiffCollapsed(areAllCollapsed)
    } else if (isDiffCompleted && isDiffCollapsed === undefined) {
      setIsDiffCollapsed(true)
    }
  }, [areAllCollapsed, isDiffCollapsed, isDiffCompleted])

  const { releases } = useReleases()
  const diffComments = getComments({
    versions: releases,
    newPath,
    fromVersion,
    toVersion,
    appName,
  })

  return (
    <Container>
      <DiffHeader
        oldPath={oldPath}
        newPath={newPath}
        fromVersion={fromVersion}
        toVersion={toVersion}
        type={type}
        diffKey={diffKey}
        hasDiff={hunks.length > 0}
        isDiffCollapsed={isDiffCollapsed}
        setIsDiffCollapsed={(collapse, altKey) => {
          if (altKey) {
            return setAllCollapsed(collapse)
          }

          setAllCollapsed(undefined)
          setIsDiffCollapsed(collapse)
        }}
        isDiffCompleted={isDiffCompleted}
        onCopyPathToClipboard={handleCopyPathToClipboard}
        copyPathPopoverContent={copyPathPopoverContent}
        resetCopyPathPopoverContent={handleResetCopyPathPopoverContent}
        onCompleteDiff={onCompleteDiff}
        appName={appName}
        appPackage={appPackage}
        diffComments={diffComments}
        packageName={packageName}
      />

      {!isDiffCollapsed && (
        <Placeholder newPath={newPath}>
          <DiffView
            viewType={diffViewStyle}
            diffType={type}
            hunks={hunks}
            widgets={diffComments}
            optimizeSelection={true}
            selectedChanges={selectedChanges}
          >
            {originalHunks => {
              const updatedHunks = getHunksWithAppName(originalHunks)

              const options = {
                enhancers: [markEdits(updatedHunks)]
              }

              const tokens = tokenize(updatedHunks, options)

              return updatedHunks.map(hunk => [
                <Decoration key={'decoration-' + hunk.content}>
                  <More>{hunk.content}</More>
                </Decoration>,
                <Hunk
                  key={hunk.content}
                  hunk={hunk}
                  tokens={tokens}
                  gutterEvents={{ onClick: onToggleChangeSelection }}
                />
              ])
            }}
          </DiffView>
        </Placeholder>
      )}
    </Container>
  )
}

/*
  Return true if passing `nextProps` to render would return
  the same result as passing prevProps to render, otherwise return false
*/
const arePropsEqual = (prevProps, nextProps) =>
  prevProps.isDiffCompleted === nextProps.isDiffCompleted &&
  prevProps.areAllCollapsed === nextProps.areAllCollapsed &&
  prevProps.diffViewStyle === nextProps.diffViewStyle &&
  prevProps.appName === nextProps.appName &&
  prevProps.appPackage === nextProps.appPackage

export default React.memo(Diff, arePropsEqual)
