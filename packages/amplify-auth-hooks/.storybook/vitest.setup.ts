import { setProjectAnnotations } from '@storybook/react-vite'
import { beforeAll } from 'vitest'
import projectAnnotations from './preview'

const annotations = setProjectAnnotations(projectAnnotations)
beforeAll(annotations.beforeAll)
