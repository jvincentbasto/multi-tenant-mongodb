const bulk = {
  success: [],
  failed: [],
  duplicates: [],
  notFound: [],
};
const getBulk = () => {
  const success = [];
  const rejects = {
    failed: bulk.failed,
    duplicates: bulk.duplicates,
    notFound: bulk.notFound,
  };

  return { success, rejects };
};
export const constants = {
  bulk,
  getBulk,
};
