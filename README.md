# disCOD
Source for hosting your own discord bot for your public server.

## **Features**
- Extremely light weight
- Supports custom plugins
- Easy to understand config
- Players can `!link` their b3 id to disCOD and can have most commands operated via Discord

## **Commands**
- Type `!help` to get a complete list of commands.<br>
- Type `!help <command>` to know how to use a command

## **Screenshots**


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
    curl -sL https://deb.nodesource.com/setup_17.x | sudo -E bash -
    sudo apt-get install git nodejs
    ```
- Clone repository and enter the folder
    ```
    git clone https://github.com/Zoro-6191/disCOD.git
    cd disCOD
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
- Go to `conf`, edit `config.json`(main config)
- All of the configs are explainatory, but make sure to stick to JSON syntax
