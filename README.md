# Ascension League Discord Bot – "CLN-C"
<img src="https://media.discordapp.net/attachments/759841406444371978/827004171822694440/Ascension_plain_Banner.png?width=2160&height=720" alt="Logo for Ascension League">

## Brief overview
This project is an updated version of the now-deprecated ACL Discord Bot for the Discord server and professional Valorant league by the name of Ascension.
It contains user-friendly roster management features for teams, and a customizable news feed with role-pickers to choose which notifications you receive, administrative functions to set roster limits and send official announcements either through direct message or to the public server. Additionally, a database to store team information such as team ID, players (user IDs), roster, cosmetic options, and game data collected throughout the season.

This program is written entirely in JavaScript, organized with Node Project Manager, and utilizing the NodeJS API.
Additionally, Discord.js v13 is used, which can be found [here at their official website](https://discord.js.org/#/). \[[GitHub repository](https://github.com/discordjs/discord.js)\]

---

## Features

- Team roster management
  > Intuitive way to manage team rosters, along with league administrators being able to impose limits on the amount of main and substitute players allowed in the team roster based on the league rules.
- Custom news-feed
  > Dynamic dropdown menus to choose which notifications users wish to receive by assigning roles to their user profile. Additionally, these menus are dynamic in which they can be easily changed by modifying the respective JSON file storing the data for each option.
- Administrative functions
  > - Set roster limits in accordance to the Ascension League rulebook; configuration and limits are stored in the serverdata JSON.
  > - Push out notifications to users directly or en-masse, via team channel, or to an official announcement channel via the `/announce ...` command group.
  > - Create, delete, or edit teams with the `/team ...` command group. These teams are stored in a simple, custom database, which can be modified, updating team channels and roles in real-time.
- Custom, simple user and team database
  > Team data is stored in each individual server by unique Discord server ID, allowing for dynamic expansion beyond the original intent, allowing for the bot to be deployed in other environments if the project were to ever go public to allow other leagues to take advantage of the features "CLN-C" has to offer.
  > User data is stored in the same manner, and allows for flexibility.
  > Both types of data streamline the process of adding new features as each user and team gets their own data stored, which leaves the door open to new features down the line.

---

## Upcoming Features

**Far more features to come, including administrative commands in order to keep order in the server, and custom user profiles to display their in-game stats and other vanity items like biographies and nicknames.**

- Vanity profiles for users.
- Scoreboard and user economy.
  > - Trading system of team cards
  > - Trading system of player cards
  > - Chat-based score system
  > - Challenge-based score system
- Administrative commands to moderate chat and behavior.
- Monitoring of chat data to see which parts of the server are most active, and what can be removed.
- Chat filter.

---

> This bot is still in development, but is currently in Beta testing with a small group of testers.

---
