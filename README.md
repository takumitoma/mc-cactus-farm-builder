<h1 align="center">Welcome to Cactus Farm Builder 👋</h1>
<p>
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> Minecraft bots that build cactus farms in Minecraft Survival Mode. Created using Javascript (Node) and the Mineflayer library.

![2023-01-16_21 45 47](https://user-images.githubusercontent.com/85015271/212819798-d5fe69ed-b0fe-4390-a1db-479afbfdd041.png)

## Install

Clone this repository and run
```sh
npm install
```
## Usage

1. Update ``config.json``. An example of one is in the examples folder.  
2. In the terminal, run
    ```sh
    node index.js
    ```
    This will spawn all the bots one by one. Wait for all of them to spawn.  
3. Create a flat land without any blocks in the air to let the bots build the cactus farm. 
4. Run the following command to move the bots to their initial positions to build. 
    ```sh
    cactus goto X Y Z
    ``` 
    The bots will be positioned in the following format and order.  
    <br/>

    ![goto_chart](https://user-images.githubusercontent.com/85015271/212655537-12135e59-1108-4a9a-8d79-9c386a8d5935.PNG)  
    <br/>

    ``X``, ``Y``, ``Z`` indicate the Minecraft coordinates of the bot located at ``1`` in the diagram. 
    #### Example
    While choosing ``numOfBots: "4"`` in ``config.json`` 
    ```sh
    cactus goto 5.5 -60 3.5
    ```
    ![Example_goto](https://user-images.githubusercontent.com/85015271/212817975-c2ac2929-af80-4f0f-b6ce-b24f3e25e1ac.png)  
    Where ``Cactus_Farm_Bot_1``'s new position is now 5.5 -60 3.5.
    
5. Supply the bots with materials to build the cactus farm. Run the following command to start building the cactus farm from the bot's current Y coordinate upwards to the Y coordinate ``Y``. 
    ```sh
    cactus build Y
    ```
    #### Example
    ```sh
    cactus build 60
    ```
    If any of the bots have insufficient number of items to finish this build, this command fails and the bots with insufficient items will announce how much items they need in the chat. 

## Author

👤 **TakumiXD**

* Github: [@TakumiXD](https://github.com/TakumiXD)

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
