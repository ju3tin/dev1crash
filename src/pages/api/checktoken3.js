async function fetchAllAssets(ownerAddress, apiKey) {
    let page = 1;
    let allItems = [];
    while (true) {
      const raw = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAssetsByOwner",
        params: { ownerAddress, page, limit: 1000 }
      });
      const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw
      });
      const result = await response.json();
      if (!result.result.items.length) break;
      allItems = allItems.concat(result.result.items);
      page++;
    }
    return allItems;
  }
  
  fetchAllAssets("EdKUk9CMJrieYcSsFx4QNKJqhUjPT6H8PncZnKv4JgF6", "4859defa-46ae-4d87-abe4-1355598c6d76")
    .then((items) => console.log(`Total assets: ${items.length}`, items))
    .catch(console.error);