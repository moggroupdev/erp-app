const ratios = {
  product: "3/4",
  logo: "5/3",
};

export default ratios;

// ================ Helpers ================

export const getRatioLabel = (ratio: string) => ratio.split("/").join(":");

const getRatioSize = (ratio: string, width: number) => {
  const [ratioWidth, ratioHeight] = ratio.split("/").map(Number);
  return { width, height: Math.round((width * ratioHeight) / ratioWidth) };
};

export const getLogoSize = (width: number) => getRatioSize(ratios.logo, width);
