const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;

const envs = {
  secrets: {
    accessToken: accessTokenSecret,
    refreshToken: refreshTokenSecret,
  },
};

export const config = {
  envs,
};
