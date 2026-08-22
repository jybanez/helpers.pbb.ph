(function installInspectionDemoMeta(global) {
  global.createInspectionDemoMeta = function createInspectionDemoMeta(config) {
    const factoryCall = `${config.factory}(overrides?)`;
    return {
      title: config.title,
      overview: config.overview,
      useWhen: config.useWhen || [],
      avoidWhen: config.avoidWhen || [],
      description: config.description,
      defaultSampleCode: config.sampleCode,
      constructor: [{
        factory: `<code>${factoryCall}</code>`,
        arguments: "optional preset overrides",
        returns: "Plain repeatable Field Group configuration for <code>createFieldGroup(...)</code>",
      }],
      options: [
        { option: "<code>label</code>", default: `<code>\"${config.title}\"</code>`, description: "Visible Field Group label." },
        { option: "<code>fields</code>", default: "preset fields", description: "Keyed field overrides. Applications must configure options for fields marked <code>requiresOptions</code>." },
        { option: "<code>extraFields</code>", default: "<code>[]</code>", description: "Additional application-owned fields appended to the preset." },
        { option: "<code>minItems</code> / <code>maxItems</code>", default: "<code>0 / 100</code>", description: "Repeatable entry limits." },
      ],
      properties: [
        { property: "<code>fields</code>", type: "<code>Array</code>", description: config.fieldsDescription },
        { property: "<code>validations</code>", type: "<code>Array</code>", description: config.validationsDescription },
        { property: "<code>entryKey</code>", type: "<code>string</code>", description: "Stable repeatable-entry key stored as <code>_entry_key</code>." },
      ],
      events: [{
        event: "<code>onChange(value, meta)</code>",
        arguments: "value array and validation metadata",
        returns: "Provided to <code>createFieldGroup(...)</code>, not the preset factory.",
      }],
      methods: [
        { method: "<code>getValue()</code>", arguments: "none", returns: `Array of ${config.valueLabel} objects` },
        { method: "<code>setValue(value)</code>", arguments: `array of ${config.valueLabel} objects`, returns: "<code>void</code>" },
        { method: "<code>validate()</code>", arguments: "none", returns: "<code>{ status, errors }</code>" },
        { method: `<code>resolveInspectionPresetSnapshot(\"${config.presetId}\", overrides?)</code>`, arguments: "preset id and overrides", returns: "Versioned normalized schema and SHA-256 digest" },
      ],
    };
  };
})(window);
