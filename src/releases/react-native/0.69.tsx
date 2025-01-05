import React, { Fragment } from 'react'
import { ReleaseT } from '../types'

const release: ReleaseT = {
  usefulContent: {
    description:
      'React Native 0.69 includes a bundled version of the Hermes engine',
    links: [
      {
        title: 'See here to learn more about bundled Hermes',
        url: 'https://reactnative.dev/architecture/bundled-hermes',
      },
    ],
  },
  comments: [
    {
      fileName: 'android/app/build.gradle',
      lineNumber: 280,
      lineChangeType: 'add',
      content: (
        <Fragment>
          These lines instruct Gradle to build hermes from source. For further
          information on bundled Hermes, look
          [here](https://reactnative.dev/architecture/bundled-hermes).
        </Fragment>
      ),
    },
  ],
}

export default release
