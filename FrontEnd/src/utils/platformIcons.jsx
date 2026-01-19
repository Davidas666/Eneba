import psIcon from '../assets/games-platform-icon/PSN.svg';
import xboxSeriesIcon from '../assets/games-platform-icon/Xbox Live.svg';
import nintendoIcon from '../assets/games-platform-icon/Nintendo.svg';
import steamIcon from '../assets/games-platform-icon/Steam.svg';
import epicIcon from '../assets/games-platform-icon/Epic Games.svg';
import gogIcon from '../assets/games-platform-icon/GOG.svg';
import rockstarIcon from '../assets/games-platform-icon/Rockstar Games Launcher.svg';
import eaIcon from '../assets/games-platform-icon/EA App.svg';

export function getPlatformIcon(platform) {
  const platformMap = {
    'PC': steamIcon,
    'PlayStation 5': psIcon,
    'PlayStation 4': psIcon,
    'Xbox Series X/S': xboxSeriesIcon,
    'Xbox One': xboxSeriesIcon,
    'Nintendo Switch': nintendoIcon,
    'Steam': steamIcon,
    'Epic Games': epicIcon,
    'GOG': gogIcon,
    'Rockstar Games': rockstarIcon,
    'EA App': eaIcon,
  };

  return platformMap[platform] || steamIcon;
};

export function getPlatformText(platform) {
  const platformTextMap = {
    'PC': 'PC',
    'PlayStation 5': 'PS5',
    'PlayStation 4': 'PS4',
    'Xbox Series X/S': 'Xbox Live',
    'Xbox One': 'Xbox Live',
    'Nintendo Switch': 'Nintendo',
    'Steam': 'Steam',
    'Epic Games': 'Epic',
    'GOG': 'GOG',
    'Rockstar Games': 'Rockstar',
    'EA': 'EA App',
  };

  return platformTextMap[platform] || platform;
};
