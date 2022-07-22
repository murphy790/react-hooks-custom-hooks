const { useReducer, useEffect } = require("react");

// helper function that returns a fetch function as well as an abort method so we can cancel the fetch if needed
// https://developers.google.com/web/updates/2017/09/abortable-fetch
function createAbortableFetch() {
  const controller = new AbortController();
  const { signal } = controller;

  return {
    fetch: (url, options) => fetch(url, { ...options, signal }),
    abort: () => controller.abort(),
  };
}

const cache = {};

function fetchReducer(state, action) {
  switch (action.type) {
    case "pending":
      return { status: "pending", data: null, error: null };
    case "resolved":
      return { status: "resolved", data: action.payload, error: null };
    case "rejected":
      return { status: "rejected", data: null, error: action.payload };
    default:
      throw new Error(`No action defined for type ${action.type}`);
  }
}

function useQuery(url, initialData = null) {
  
  const [{ status, data, error }, dispatch] = useReducer(fetchReducer, {
    status: "idle",
    data: initialData,
    error: null,
  });

  useEffect(() => {
    if (cache[url]) {
      
      dispatch({ type: "resolved", payload: cache[url] });
    } else {
      
      dispatch({ type: "pending" });
    }

    const { fetch, abort } = createAbortableFetch();

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
      
        cache[url] = data;
      
        dispatch({ type: "resolved", payload: data });
      })
      .catch((err) => {
  
        if (err.name !== "AbortError") {
          dispatch({ type: "rejected", payload: err });
        }
      });

    return function () {
  
      abort();
    };
  }, [url]);

  return {
    data,
    isLoaded: status === "resolved",
    isError: status === "rejected",
    error,
  };
}

export default useQuery;