<div align='center'>

<h1>Capstone Project - WellMesh</h1>
<p>An application designed to help facilitate the planning of events catering for small departments within a company in regards to activities to improve team-bonding, charity donations and maintaining a healthy work-life balance.</p>

<h4> <span> · </span> <a href="https://github.com/EnzoLeone17/IOD_SE_Capstone_Project/issues"> Report Bug </a> <span> · </span> <a href="https://github.com/EnzoLeone17/IOD_SE_Capstone_Project/issues"> Request Feature </a> </h4>


</div>

# :notebook_with_decorative_cover: Table of Contents

- [About the Project](#star2-about-the-project)
- [Roadmap](#compass-roadmap)


## :star2: About the Project
### :space_invader: Tech Stack
<details> <summary>Client</summary> <ul>
<li><a href="https://nextjs.org">Frontend using Next JS</a></li>
</ul> </details>
<details> <summary>Server</summary> <ul>
<li><a href="https://expressjs.com">Backend using Express JS</a></li>
</ul> </details>
<details> <summary>Database</summary> <ul>
<li><a href="https://www.mysql.com">MySql</a></li>
</ul> </details>

### :dart: Features
- Account registration
- Email verification (first time)
- Create and manage events
- create and manage event activities
- location display
- Email notifications


## :toolbox: Getting Started

### :bangbang: Prerequisites

- Install Node JS on computer<a href="https://nodejs.org/en/download"> Here</a>
- Use a code editor preferably VSCode<a href="https://code.visualstudio.com/Download"> Here</a>
- Windows Sub-sytem for Linux (WSL) for windows users<a href="https://learn.microsoft.com/en-us/windows/wsl/install"> Here</a>
- MySql database (download workbench for user interface)<a href="https://www.mysql.com/downloads"> Here</a>


### :gear: Installation

This project uses Node as package manager which is installed by default with Node JS


### :running: Run Locally

Clone the project

```bash
https://github.com/Enzo-Leone17/IOD_SE_Capstone_Project
```
Navigate to the backend portion
```bash
cd .\backend\
```
**Ensure database name and user details (hostname > e.g root, hostpassword) setup in .env*

Add tables to local MySql database through sequelize
```bash
npx sequelize-cli db:migrate
```
Optionally run seeders for sample data
```bash
npx sequelize-cli db:seed:all
```
Running Redis server (on new terminal, WSL for windows user)
```bash
sudo redis-server /etc/redis/redis.conf
```
Start the server
```bash
npm start
```

Open a new terminal and navigate to the frontend portion
```bash
cd .\Frontend\wellmesh-frontend\
```
Install dependencies
```bash
npm install
```
Run development server
```bash
npm run dev
```
Visit localhost for frontend application
```url
http://localhost:3000
```


## :compass: Roadmap

* [ ] Deployment for backend server + database
* [ ] Upload media via google cloud service
* [ ] Enhance UI on Email notifications
* [ ] Payment service via Stripe
* [ ] Feature: Event recommendation + upcoming reminder
