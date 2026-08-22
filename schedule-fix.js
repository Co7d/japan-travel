(() => {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    if (!url.endsWith("data.json")) return response;
    const json = await response.clone().json();
    json.schedule = (json.schedule || []).map(day => ({
      ...day,
      items: (day.items || []).flatMap(item => {
        if (!item.transport || !item.label) return [item];
        const event = {...item};
        const transport = {slot:item.slot, transport:item.transport};
        delete event.transport;
        return [event, transport];
      })
    }));
    return new Response(JSON.stringify(json), {status:200, headers:{"Content-Type":"application/json"}});
  };
})();
