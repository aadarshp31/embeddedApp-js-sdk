// Example usage for local type checking only (not published)
// Globals (ZOHO, zrc) are ambient declarations provided by the types package.

ZOHO.embeddedApp.on("PageLoad", (data) => {
  console.log("Loaded", data);
});

async function run() {
  await ZOHO.embeddedApp.init();
  const user = await ZOHO.CRM.CONFIG.getCurrentUser();
  console.log(user.full_name);

  const lead = await ZOHO.CRM.API.getRecord?.({ Entity: "Leads", RecordID: "123" });
  console.log(lead);

  const resp = await zrc.get("/crm/v6/Leads/123");
  console.log(resp.status, resp.data);
}

run();
