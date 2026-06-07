module.exports = {
  default: {
    import: [
      'features/step_definitions/**/*.ts',
      'features/support/**/*.ts',
    ],
    paths: ['features/**/*.feature'],
    format: ['progress', 'summary'],
    publishQuiet: true,
  },
};
