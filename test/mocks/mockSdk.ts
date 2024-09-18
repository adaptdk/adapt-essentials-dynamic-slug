import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
  entry: {
    getSys: () => {
      return {
        createdAt: new Date(),
        id: 'test-entry',
        spaceId: 'test-space',
        environmentId: 'test-environment',
        typeId: 'test-type',
        typeName: 'test-type-name',
      };
    },
    fields: {
      testField: {
        getValue: vi.fn(),
      },
    },
    onSysChanged: vi.fn(),
  },
  parameters: {
    instance: {
      template: 'test-template',
      previewTemplate: 'test-preview-template',
      fieldToSlugify: 'test-field-to-slugify',
    },
    installation: {},
  },
  field: {
    id: 'test-field',
    getValue: vi.fn(),
  },
};

export { mockSdk };
