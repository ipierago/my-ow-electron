const { app, BrowserWindow } = require('electron');

let mainWindow;

app.on('ready', function () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Load index.html into the mainWindow
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const setRequiredFeaturesForSupportedGames = async () => {
  const supportedGames = await app.overwolf.packages.gep.getSupportedGames();
  console.log(`supportedGames: ${JSON.stringify(supportedGames)}`);

  for (let i = 0; i < supportedGames.length; i++) {
    const game = supportedGames[i];
    const id = game.id;

    setRequiredFeatures(id);
  }
};

const setRequiredFeatures = async (id) => {
  console.log(`setRequiredFeatures(${id})`);

  const info = await app.overwolf.packages.gep.getInfo(id);
  console.log(`info: ${JSON.stringify(info)}`);

  const features = await app.overwolf.packages.gep.getFeatures(id);
  console.log(`features: ${JSON.stringify(features)}`);

  await app.overwolf.packages.gep.setRequiredFeatures(id, null);
  console.log(`setRequiredFeatures(${id}, null) done`);
};

const setupGEP = async () => {
  app.overwolf.packages.gep.on('error', (event, gameId, error, ...args) => {
    console.error(
      `app.overwolf.packages.gep.on: 'error', error: ${error}, args: ${JSON.stringify(
        args
      )}`
    );
  });

  app.overwolf.packages.gep.on(
    'game-detected',
    (event, gameId, name, ...args) => {
      console.log(
        `app.overwolf.packages.gep.on: 'game-detected', gameId: ${gameId}, name: ${name}, args: ${JSON.stringify(
          args
        )}`
      );
      setTimeout(() => {
        setRequiredFeatures(gameId);
      }, 3000);
    }
  );

  app.overwolf.packages.gep.on('new-info-update', (event, gameId, data) => {
    console.log(
      `app.overwolf.packages.gep.on: 'new-info-update', gameId: ${gameId}, data: ${JSON.stringify(
        data
      )}`
    );
    const { category, feature, key, value } = data;
    console.log(
      `category: ${category}, feature: ${feature}, key: ${key}, value: ${value}`
    );
  });

  app.overwolf.packages.gep.on('new-game-event', (event, gameId, data) => {
    console.log(
      `app.overwolf.packages.gep.on: 'new-game-event', gameId: ${gameId}, data: ${JSON.stringify(
        data
      )}`
    );
    const { feature, key, value } = data;
    console.log(`feature: ${feature}, key: ${key}, value: ${value}`);
  });

  //setRequiredFeaturesForSupportedGames();
};

const setupCMP = async () => {
  const isCMPRequired = await app.overwolf.isCMPRequired();
  console.log(`isCMPRequired: ${isCMPRequired}`);
  if (isCMPRequired) {
    await app.overwolf.openCMPWindow();
  }
};

const setupOverwolf = async () => {
  await setupCMP();

  app.overwolf.packages.on('package-update-pending', (event, info) => {
    console.log(
      `app.overwolf.packages.on: 'package-update-pending', info: ${JSON.stringify(
        info
      )}`
    );
  });

  app.overwolf.packages.on('updated', (event, packageName, version) => {
    console.log(
      `app.overwolf.packages.on: 'updated', packageName: ${packageName}, version: ${version}`
    );
  });

  app.overwolf.packages.on('failed-to-initialize', (event, packageName) => {
    console.log(
      `app.overwolf.packages.on: 'failed-to-initialize', packageName: ${packageName}`
    );
  });

  app.overwolf.packages.on('ready', (event, packageName, version) => {
    console.log(
      `app.overwolf.packages.on: 'ready', packageName: ${packageName}, version: ${version}`
    );
    if (packageName === 'gep') {
      setupGEP();
    }
  });
  console.log('setupOverwolf done');
};

app.whenReady().then(() => {
  const appID = process.env.OVERWOLF_APP_UID;
  console.log(`AppID: ${appID}`);
  setupOverwolf();
});
