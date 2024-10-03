Backend for Trend-N-Trade.

Before development or running a server, take the following steps:
1. run npm install
2. create a .env file with the following variables:
    - PORT=port_number_here
    - DB_URI=mongodb+srv://<USER>:<PASSWORD_HERE>@tnt-cluster-0.ntra4in.mongodb.net/?retryWrites=true&w=majority&appName=tnt-cluster-0
    - BD_NAME=db_name_here
3. To run a local server, run the following in the project root directory: node src/server.js

