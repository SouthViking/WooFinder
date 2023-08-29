<div id="header" align="center">
  <img src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/ce9484b3-9994-4b30-ab7c-f461ddcef0a0/detxm7r-74d150c4-5c1e-43fc-a87a-345f39260bbb.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2NlOTQ4NGIzLTk5OTQtNGIzMC1hYjdjLWY0NjFkZGNlZjBhMFwvZGV0eG03ci03NGQxNTBjNC01YzFlLTQzZmMtYTg3YS0zNDVmMzkyNjBiYmIucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.tNpGYB6skYQHjrRtoDNzj--LYeA7jhBBIe2uwqib32M" width="280"/>
  <h1>
  🐾 WooFinder 🐾 
</h1>
  <div id="badges">
    <a href="www.linkedin.com/in/sebastián-ignacio-toro-severino-06881a1a1" target="_blank">
      <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Badge"/>
    </a>
    <a href="mailto:seb.toro.severino@gmail.com">
      <img src="https://img.shields.io/badge/Gmail-red?style=for-the-badge&logo=gmail&logoColor=white" alt="Gmail Badge"/>
    </a>
</div>

<hr>
  
</div>

### ❓ What is WooFinder? 

People like to have pets, but saddendly, sometimes pets can get lost. You would usually place posters near to the location where they get lost to try to catch the interest of other people... but why not taking advantage of the technology?
**WooFinder** is a Telegram Bot that allows you to register your pets and generate reports in case they get lost, so other people can use the bot to find reports that are near their location.

Specifically, with **WooFinder** you will be able to:

* 🐾 Register/update/remove pets.
<br>

* 🔎 Register/update/remove lost pet reports.
<br>

* 📍 Get a list of lost pet reports that are near to a provided location.
<br>

* 🔔 Send a notification to the owner/s with your contact data, whenever you find/see a lost pet.

### 🤖 Bot commands

There are 2 commands that will display all the available options. Each time you select one of the options, a conversation will start and other commands won't be executed, unless you send the **"exit"** keyword to the bot.

* **/pets** → Displays the pet's menu with the following options:

<div align="center">
  <img src="https://i.imgur.com/7nVU1OF.jpg" width="350"/>
</div>

* **/reports** → Displays the report's menu with the following options:

<div align="center">
  <img src="https://i.imgur.com/Ejh9luO.jpg" width="350"/>
</div>

### 📁 Project structure

There are multiple folder within the main `src` folder.

* **Handlers**: Contains the actual handlers or callbacks that are registered in the app. These functions represent the logic behind the commands and actions of the bot. They are imported from the `app` file.

* **Middlewares**: Contains the definition of the middlewares that will be used by the bot. They are imported from the `app` file.

* **Scenes**: Contains the logic and the flow for each registered scene. A Telegraf scene is a flow that will be started when executing the `enter` method from the Telegram `context`. Each scene has a unique scene ID and a certain number of steps to be executed (which can be traversed by the bot in any order).
Specifically for this app, scenes are used to implement the actual business logic of the bot, so it is being executed whenever there is a pet registration, update, etc.

* **Types**: Different Typescript types/interfaces/enums used along the project.

* **Utils**: Different type of functions that are used in multiple places to mainly simplify the logic in the scenes flows.

* **Validators**: Contains files with validator functions for user inputs.

### ⚙️ Installation and execution steps

There are different ways to install and run the project. However, for all of them you will need to define a environment file (`.env`) in the root folder containing the credentials for the bot (`BOT_TOKEN`) and the connection string for your Mongo DB (`DB_CONNECTION_STRING`). Make sure to place your own credentials before continuing.

#### Execution in local machine

1. To execute the project in your local machine you first will need to make sure you have Node install (https://nodejs.org/en/download).
2. Once Node and `npm` are ready to be used, install the required packages by running `npm install` from the root folder.
3. Execute `npm run build` to build the transpiled JS files from TS files. A `dist` folder will be generated.
4. Inside `package.json` file you will see the list of scripts to run the app. Use `npm run start` to start the bot without reloading the app on file changes, and `npm run start:reload` in case you want to reload the app with `nodemon` every time you make a code change. (**Note**: both commands execute the `app.js` file of the `dist` directory. In case you want to use the `npm run start:reload` cmd, you will need to open a terminal and execute `tsc --w` from the root folder to watch changes on the TS files and automatically transpile them, so nodemon can also detect changes in the `dist`.)
5. Go to the bot in your Telegram app and start talking with it!

#### Execution with Docker

If you only want to execute the bot without using it for development purposes we recommend you to run it in a Docker container, so you don't have to take care of installing any required tools.

1. Make sure the machine in which you are going to execute the bot has Docker installed and running. (https://docs.docker.com/get-docker/)
2. From the root folder, execute the following command to create the container and start the bot: `docker-compose up -d`.
3. From the root folder, execute the following command to shut the bot down: `docker-compose down -d`.

### 💻 Development

#### 👨‍💻 How to develop?

Please follow the steps provided in the [Execution in local machine section](#execution-in-local-machine).

#### 🐞 Debug

If you are using VSCode, go to the "debug" section. In the menu at the top of the screen you will see options to run the bot with or without reload (which execute the scripts provided in the `package.json` file). Use one of those options and you will be able to set breakpoints in any part of the project.

### 🥇 Credits 

This project has been created and developed by **SouthViking** as a personal project.

#### Acknowledgements

* **Telegraf.js** (https://github.com/telegraf/telegraf)
* **javascript-time-ago** (https://gitlab.com/catamphetamine/javascript-time-ago)
* **MongoDB** (https://github.com/mongodb/mongo)


Feel free to add new features or bug fixes in case you find some. Please open a **pull request** using your **own branch** and don't forget to add me as reviewer!
