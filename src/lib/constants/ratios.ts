const ratios = {
  product: "3/4",
};

export default ratios;

// ================ Helpers ================

export const getRatioLabel = (ratio: string) => ratio.split("/").join(":");
