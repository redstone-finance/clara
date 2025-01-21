export async function fetchTransactions(agentAddress, processId, after) {
  const url = 'https://arweave-search.goldsky.com/graphql';
  const headers = {
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json',
  };

  // FIXME: pass params properly
  const body = JSON.stringify({
    query: `query {
      transactions(
        first: 100
        sort: INGESTED_AT_ASC
        recipients: ["${agentAddress}"]
        tags: [
          {
            name: "From-Process"
            values: ["${processId}"]
          }
          { name: "Action", values: ["Task-Assignment", "Task-Result"] }
        ]
        after: "${after}"
      ) {
        edges {
          cursor
          node {
            id
            tags {
              name
              value
            }
            block {
              timestamp
              height
            }
          }
        }
      }
    }
`
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: body,
    keepalive: true
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.data.transactions.edges;
};

export async function loadTxData(txId) {
  const response = await fetch(`https://arweave.net/${txId}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
}
