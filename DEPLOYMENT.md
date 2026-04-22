# TypeRush Deployment Guide (100% Free)

Your application is now fully production-ready! It uses environment variables (`process.env`) to connect to your database and binds to relative URLs to easily support deployment.

Here is the step-by-step process to deploy your full-stack TypeRush application for free.

## Step 1: Push your code to GitHub
Most free hosting platforms easily integrate with GitHub to deploy your code whenever you push automatically.
1. Initialize a git repository in your project root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for production"
   ```
2. Create a new repository on [GitHub](https://github.com/) and push your code.

---

## Step 2: Get a Free MySQL Database
Since we need a MySQL database, there are a couple of excellent free-tier alternatives (PlanetScale is no longer free):

**Option A: Aiven (Recommended)**
1. Go to [Aiven](https://aiven.io/free-mysql-database) and sign up for a free account.
2. Create a new MySQL instance.
3. Wait for the database to provision, then view your **Connection Details** (host, port, user, password, database name).
4. Note that Aiven databases often require SSL connections, so we might need to add `ssl: { rejectUnauthorized: false }` to the connection pool if Aiven enforces it.

**Option B: TiDB Serverless**
1. Go to [TiDB Serverless](https://en.pingcap.com/tidb-serverless/) and sign up.
2. It gives you a MySQL compatible database with 5GB of free storage.
3. Generate a password and snag the Host, Port, and User to connect. 

---

## Step 3: Deploy the Node.js Backend & Frontend on Render
[Render](https://render.com/) offers a fantastic free tier for Node.js Web Services. Since your application serves both the Frontend HTML/JS and the REST/WebSocket Server on a single unified node instance, Render is perfect.

1. Go to [Render.com](https://render.com) and create an account using GitHub.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Fill out the configuration:
   * **Name**: TypeRush
   * **Runtime**: Node
   * **Build Command**: `cd backend && npm install`
   * **Start Command**: `cd backend && node server.js`
   * **Plan**: Free

### Step 4: Configure Environment Variables
While you are still in Render configuring your Web Service, scroll down and click **Advanced** -> **Add Environment Variable**.

Add the following based on your DB credentials from Step 2:
*   **`DB_HOST`** : *Paste your DB Host (e.g., mysql-xyz.aivencloud.com)*
*   **`DB_USER`** : *Paste your DB User (e.g., avnadmin)*
*   **`DB_PASSWORD`** : *Paste your DB Password*
*   **`DB_PORT`** : *Paste your DB Port (usually 3306 or 11776)*
*   **`DB_NAME`** : *Paste your DB Name (e.g., defaultdb)*

After adding these, click **Create Web Service**. 

---

## Step 5: Initialize the Database Tables
Because this is a completely new database, you have to run your `setup-db.js` file against it to create the tables.

In the Render dashboard for your Web Service:
1. Wait for the initial deployment to finish (it might crash or fail since tables don't exist yet).
2. Go to the **Shell** tab (a built-in terminal for your running server).
3. Run the following command:
   ```bash
   node setup-db.js
   ```
4. This will connect to your new production database, create the `users`, `words`, and `multiplayer` tables, and seed the dictionary!
5. After it succeeds, restart your server by restarting the Web Service or Triggering a Deploy.

🎉 **You are live!** You can access your typing application at the `.onrender.com` URL provided by Render. Both REST APIs and WebSocket multiplayer will function perfectly through that URL.
