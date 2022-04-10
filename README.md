# disCOD
Source for hosting your own discord bot for your public server.</br>
[disCOD B3 Plugin](https://github.com/jyotirmay-exe/b3-plugin-disCOD) is needed to be setup after you've launched the bot for first time. disCOD can run perfectly fine without it, but comes with lesser features without the b3 plugin.

TO-DO: Need to internally standardize the bot so plugin development is easier, and need to update docs.

## **Features**
- Extremely light weight (runs perfectly fine in my singlecore 1GB RAM VPS along with Cod4x server and B3)
- Tested for months
- Supports custom plugins
- Easy to understand and edit config
- Players can `!link` their b3 id to disCOD and can have most commands operated via Discord
- Players need to link their account to have auto kill-based promotion
- Preinstalled plugin includes [Screenshot Uploading Plugin](https://user-images.githubusercontent.com/52291201/148685552-e16c55d8-68fd-4866-830b-90e2138546e4.png)


## **Commands**
- Type `!help` to get a complete list of commands.<br>
- Type `!help <command>` to know how to use a command

## **Screenshots**
![image](https://user-images.githubusercontent.com/52291201/148685462-a2935821-9ea4-40ac-8f47-d6996b072446.png)
![image](https://user-images.githubusercontent.com/52291201/148685398-a12088eb-6d80-4fa0-827f-2c0d20c370fc.png)
![image](https://user-images.githubusercontent.com/52291201/148685476-f014c7eb-1ea5-4f5c-8136-7ee58be9c431.png)
![image](https://user-images.githubusercontent.com/52291201/148685803-dc869ef6-e99a-4f86-b422-578c8e8caa0c.png)


See it in action at [[v.F] Discord Server](https://discord.gg/vgK6G4eG3N)

# How to Install

Steps:
- [Creating a bot client in Discord Dev Portal](https://discordpy.readthedocs.io/en/stable/discord.html)
    - Be sure to give it Administrator Permission (Under `Bot Permissions`)
- Installing disCOD locally
    - [Linux](#linux)
    - [Windows](#windows)
- Installing disCOD B3 Plugin
- [Configuring disCOD](#configuring-discod)

## **Linux**
- Make sure [Git](https://git-scm.com/downloads) and latest [NodeJS v16](https://nodejs.org/en/download/) are installed. Paste these one by one in terminal.
    ```
    sudo apt update && sudo apt upgrade
    sudo apt install curl
    curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install git nodejs
    ```
- Clone repository and enter the folder
    ```
    git clone https://github.com/Zoro-6191/disCOD.git
    cd disCOD
    npm run prebuild
    ```
- After [configuring](#configuring-discod), run disCOD using:
    ```
    node .
    ```
## **Windows**
- Install [Git](https://git-scm.com/downloads) and [NodeJS v16](https://nodejs.org/en/download/)
- Go to directory where you want to install disCOD
- Right click and open Git Bash
- Paste this in git bash:
    ```
    git clone https://github.com/Zoro-6191/disCOD.git
    cd disCOD
    ```
- After [configuring](#configuring-discod), run disCOD using:
    ```
    node .
    ```

# Configuring disCOD
- Go to `buid/conf`, edit `config.json`(main config)
- All of the configs are explainatory, but make sure to stick to JSON syntax
