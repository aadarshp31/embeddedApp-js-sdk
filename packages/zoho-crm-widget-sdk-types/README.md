# zoho-crm-widget-sdk-types

TypeScript type definitions for the **Zoho CRM Widget SDK v1.5** (`ZOHO.embeddedApp`, `ZOHO.CRM`, `zrc`).

> These definitions are extracted / inferred from the minified SDK (`ZohoEmbededAppSDK.min.js`) and helper (`ZohoCrmHelper.js`) shipped for v1.5. They are provided as-is for developer convenience and may evolve with community feedback.

## Installation

```bash
npm install --save-dev zoho-crm-widget-sdk-types
# or
yarn add -D zoho-crm-widget-sdk-types
# or
pnpm add -D zoho-crm-widget-sdk-types
```

## Usage

Add the package to your `tsconfig.json` so the global namespaces are available (they are ambient declarations – no import required; do NOT `import { ZOHO } from '...'`):

```jsonc
{
  "compilerOptions": {
    "types": ["zoho-crm-widget-sdk-types"]
  }
}
```

Then you can write code with IntelliSense:

```ts
ZOHO.embeddedApp.on("PageLoad", (data) => {
  console.log("Widget Loaded", data);
});

ZOHO.embeddedApp.init().then(ctx => {
  return ZOHO.CRM.API.getRecord({ Entity: "Leads", RecordID: "1234567890" });
});

zrc.get("/crm/v6/Leads/1234567890").then(r => {
  console.log(r.data, r.status);
});
```

## Contents

- Global ambient namespace `ZOHO` (Embedded App + CRM sections)
- Sub-namespaces: `CRM`, `CRM.API`, `CRM.CONFIG`, `CRM.META`, `CRM.FUNCTIONS`, `CRM.EVENTS`, `CRM.UI`, `CRM.HTTP`, `CRM.CONNECTOR`, `CRM.CONNECTION`, `CRM.WIZARD`, `CRM.BLUEPRINT`
- Helper constants & utility types
- The HTTP helper `zrc` with `get / post / put / patch / delete / options / head / request / createInstance`
- Event name union: `EmbeddedAppEventName = 'PageLoad' | 'Init' | 'Parent' | string`
- Error classes: `ZrcValidationError`, `ZrcError`, `ApiError`, `ConnectionError`

## Versioning

`1.5.x` tracks the Zoho CRM Widget SDK 1.5 major. Minor/patch bumps only add or refine typings (backwards compatible). Breaking type changes will increment the major version of this types package (not necessarily the SDK version).

## Contributing

PRs welcome. Please include:
- Clear description / link to official docs or SDK snippet
- Minimal reproducible example illustrating new / changed types

## Disclaimer

These type definitions are unofficial. Always test against the runtime SDK. If you find mismatches or missing surface areas, please open an issue.

## License

Apache-2.0
