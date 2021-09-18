/*
module.exports = {
  webpack: (config, { isServer }) => {
    config.experiments = {
      topLevelAwait: true,
    };
    config.resolve.fallback = {
      crypto: false,
      fs: false,
      path: false,
    };
    // If in client, don't use fs module in npm
    //if (!isServer) {
    //  config.node = {
    //    fs: "empty",
    //  };
    //}

    return config;
  },
};
*/

module.exports = {
  reactStrictMode: true,
  webpack5: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.node = {
        fs: "empty",
      };
    }

    return config;
  },
};
