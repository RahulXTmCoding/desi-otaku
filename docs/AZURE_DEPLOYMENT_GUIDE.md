# Azure Backend Deployment Guide

This guide provides a comprehensive walkthrough for deploying the backend of the custom t-shirt shop to Microsoft Azure. The architecture is designed to be secure, scalable, and automated, mirroring the best practices of the existing AWS deployment.

We will use the following core Azure services:
- **Azure App Service**: A fully managed platform (PaaS) for building, deploying, and scaling web apps. It handles the underlying infrastructure, allowing us to focus on the application code.
- **Azure Key Vault**: A secure service for storing and accessing secrets, such as API keys and database connection strings. This is the Azure equivalent of AWS Systems Manager (SSM) Parameter Store.
- **Deployment Slots**: A feature of Azure App Service that allows for zero-downtime deployments by enabling a "blue-green" deployment strategy. **Note:** This is available on Standard, Premium, and Isolated tiers, but not on the Basic (B1) tier. This guide will cover both deployment methods.

## Deployment Architecture Overview

The deployment process will be fully automated using a GitHub Actions workflow. Here's how it will work:

1.  **Trigger**: The workflow will trigger on a push to the `main` or `production` branch.
2.  **Authentication**: GitHub Actions will securely authenticate with Azure using a Service Principal.
3.  **Secret Management**: The workflow will read secrets from GitHub Secrets and securely push them into Azure Key Vault.
4.  **Build & Deploy**: The workflow will check out the code, install dependencies, and deploy the application to a "staging" deployment slot in Azure App Service.
5.  **Warm-up & Swap**: After the application is deployed to the staging slot, it will be "warmed up." Once all health checks pass, the staging slot will be swapped with the production slot. This is an atomic operation that ensures zero downtime for users.
6.  **Application Configuration**: The production App Service will be configured with a Managed Identity that has permissions to read secrets from Azure Key Vault, ensuring the application can securely access its configuration at runtime without exposing secrets in the code.

---

## Step 1: Azure Infrastructure Setup

### 1.1. Create an Azure App Service Plan and App Service
1.  **Create a Resource Group**: In the Azure Portal, create a new Resource Group (e.g., `tshirt-shop-prod-rg`).
2.  **Create an App Service Plan**: This defines the underlying compute resources.
    -   **Name**: `tshirt-shop-prod-plan`
    -   **Operating System**: Linux
    -   **Region**: Choose a region (e.g., `East US`)
    -   **Pricing tier**: Choose a suitable tier (e.g., `Premium V2` for production features like deployment slots).
3.  **Create a Web App (App Service)**:
    -   **Resource Group**: Select the one created above.
    -   **Name**: Choose a globally unique name (e.g., `custom-tshirt-shop-backend`). This will be part of your URL (`custom-tshirt-shop-backend.azurewebsites.net`).
    -   **Publish**: Code
    -   **Runtime stack**: Node 18 LTS
    -   **Operating System**: Linux
    -   **App Service Plan**: Select the plan created above.
    -   **Note on Pricing Tier**: If you choose a Basic (B1) plan, you will not have access to Deployment Slots. The workflow will perform a direct "in-place" deployment, which involves a brief application restart. For production environments requiring zero downtime, a Standard or Premium tier is recommended.

### 1.2. Create an Azure Key Vault
1.  In the Azure Portal, search for "Key Vault" and create a new one.
    -   **Resource Group**: Select the same resource group.
    -   **Key Vault name**: Choose a unique name (e.g., `tshirt-shop-kv-prod`).
    -   **Region**: Select the same region as your App Service.
    -   **Pricing tier**: Standard.
2.  Leave the rest of the settings as default and create the vault.

### 1.3. Configure App Service Managed Identity
1.  Navigate to your created App Service (`custom-tshirt-shop-backend`).
2.  In the left menu, go to **Settings -> Identity**.
3.  Under the **System assigned** tab, switch the **Status** to **On** and save. This creates a security identity for your application in Azure AD.

### 1.4. Grant App Service Access to Key Vault
Your Key Vault will use one of two permission models: **Azure role-based access control** (recommended) or **Vault access policy**. Follow the instructions for the model your Key Vault is configured with.

#### Method 1: Azure Role-Based Access Control (RBAC)
This is the modern and recommended approach.

1.  Navigate to your Key Vault (`tshirt-shop-kv-prod`).
2.  In the left menu, go to **Access control (IAM)**.
3.  Click the **+ Add** button and select **Add role assignment**.
4.  On the **Role** tab, search for and select the **Key Vault Secrets User** role. This role provides the necessary permissions to read secrets. Click **Next**.
5.  On the **Members** tab, select **Managed identity** for the "Assign access to" option.
6.  Click **+ Select members**. In the new pane, select your subscription and find the managed identity for your App Service (it will have the same name, e.g., `custom-tshirt-shop-backend`). Select it and click **Select**.
7.  Click **Review + assign** to grant the App Service's identity access to read secrets from your Key Vault.

#### Method 2: Vault Access Policy (Legacy)
If your Key Vault is using the older access policy model, follow these steps.

1.  Navigate to your Key Vault (`tshirt-shop-kv-prod`).
2.  In the left menu, go to **Settings -> Access policies**.
3.  If you see a message about RBAC, you should use Method 1. Otherwise, click **+ Create**.
4.  Under **Secret permissions**, select `Get` and `List`.
5.  Click **Next**. In the **Principal** selection pane, search for the name of your App Service's managed identity (`custom-tshirt-shop-backend`) and select it.
6.  Click through the remaining steps and click **Create** to add the access policy.

### 1.5. Create a Deployment Slot (Optional - For Zero-Downtime Deployments)
**Note:** This step is only applicable if you are using a Standard, Premium, or Isolated App Service Plan. If you are on the Basic (B1) tier, you can skip this step.

1.  Navigate to your App Service.
2.  In the left menu, go to **Deployment -> Deployment slots**.
3.  Click **+ Add Slot**.
    -   **Name**: `staging`
    -   **Clone settings from**: `custom-tshirt-shop-backend` (your production slot).
4.  This creates a new staging environment with its own URL.

---

## Step 2: GitHub and CI/CD Setup

### 2.1. Configure Secure Authentication with OpenID Connect (OIDC)
To allow GitHub Actions to securely access Azure without long-lived secrets, we will configure a trust relationship using OpenID Connect (OIDC). This is the modern, recommended approach.

#### 2.1.1. Create a Microsoft Entra ID Application and Service Principal
1.  Open the Azure Cloud Shell or use the Azure CLI locally and log in (`az login`).
2.  Create a Microsoft Entra ID (formerly Azure AD) application.
    ```bash
    az ad app create --display-name "GitHubActions-TshirtShop"
    ```
    This command will output a JSON object. **Copy the `appId-9e02ad92-055d-48c8-ac98-6ec9ea6e5cae` value**, which is your **Client ID**.
3.  Create a service principal for the application you just created. Replace `<appId>` with the value you copied.
    ```bash
    az ad sp create --id <appId>
    ```
4.  Grant the service principal the **Key Vault Administrator** role directly on the Key Vault. This role provides comprehensive permissions to manage secrets, keys, and certificates within the Key Vault. Replace `<key-vault-name>`, `<resource-group-name>`, `<subscription-id>`, and `<appId>`.
    ```bash
    az role assignment create --role "Key Vault Administrator" --subscription <subscription-id> --assignee <appId> --scope /subscriptions/<subscription-id>/resourceGroups/<resource-group-name>/providers/Microsoft.KeyVault/vaults/<key-vault-name>
    ```
    **Note**: While "Contributor" on the resource group *can* sometimes be sufficient, explicitly granting "Key Vault Administrator" on the Key Vault itself is a more robust solution for CI/CD pipelines that need to manage secrets, and directly addresses the "Forbidden" error you encountered.

#### 2.1.2. Create a Federated Credential in Azure
This step establishes the trust relationship between your Microsoft Entra ID application and your GitHub repository.

1.  In the Azure Portal, search for and navigate to **Microsoft Entra ID**.
2.  Select **App registrations** from the left menu.
3.  Select your application (`GitHubActions-TshirtShop`).
3.  Go to **Certificates & secrets -> Federated credentials**.
4.  Click **Add credential**.
5.  In the "Federated credential scenario" dropdown, select **GitHub Actions deploying Azure resources**.
6.  Fill in the details:
    -   **Organization**: Your GitHub organization or username.
    -   **Repository**: Your repository name (e.g., `desi-otaku`).
    -   **IMPORTANT**: The Organization and Repository names are **case-sensitive** and must exactly match the casing in your GitHub URL (e.g., `github.com/RahulXTmCoding/desi-otaku`). The error `AADSTS7002138` that you encountered is almost always caused by a case mismatch in one of these fields. Please double-check them carefully.
    -   **Entity type**: `Environment`.
    -   **GitHub environment name**: `production`. This should match the environment name in your GitHub Actions workflow. **IMPORTANT**: This field is also **case-sensitive**. If your workflow uses `production` (lowercase), you must enter `production` here, not `Production`.
    -   **Name**: Give it a descriptive name, e.g., `github-production-deploy`.
7.  Click **Add**.

### 2.2. Add Secrets to GitHub
1.  In your GitHub repository, go to **Settings -> Secrets and variables -> Actions**.
2.  You need to add the following secrets for the OIDC authentication to work:
-   `AZURE_CLIENT_ID`: The `appId` of the Microsoft Entra ID application you created.
-   `AZURE_TENANT_ID`: Your Azure Tenant ID. You can find this on the main **Overview** page of **Microsoft Entra ID**.
-   `AZURE_SUBSCRIPTION_ID`: Your Azure Subscription ID.

**How This Works (OIDC Authentication):** You might wonder how just these three values are enough. The `azure/login` action in the workflow uses these IDs to request a temporary access token from Azure. It proves its identity using a short-lived OIDC token automatically generated by GitHub (enabled by the `permissions` key in the workflow file). Azure validates this token against the federated credential you created, establishing a secure, passwordless connection for the duration of the job.

3.  Next, add all the required application environment variables from the `techContext.md` as GitHub secrets. These will be synced to Key Vault during the deployment.
4.  Add all the required application environment variables from the `techContext.md` as GitHub secrets. These will be synced to Key Vault during the deployment.
    -   `DATABASE`
    -   `SECRET`
    -   `CLIENT_URL`
    -   `RAZORPAY_KEY_ID`
    -   `RAZORPAY_KEY_SECRET`
    -   `BREVO_API_KEY`
    -   `MSG91_AUTH_KEY`
    -   `REDIS_URL`
    -   ...and all others listed in the AWS deployment workflow.

---

## Step 3: Configure the Application for Azure

### 3.1. Configure App Service Application Settings to Reference Key Vault Secrets

**Use Case:** This step securely connects your application to the secrets stored in Azure Key Vault without exposing them in your code or configuration files.

By using Key Vault references (`@Microsoft.KeyVault(...)`), you are telling Azure App Service to perform the following actions when your application starts:
- Use the app's Managed Identity (which we configured earlier) to securely authenticate with the specified Key Vault.
- Fetch the secret value from the vault.
- Inject that value into the application as a standard environment variable (e.g., `process.env.DATABASE` in Node.js).

This is the modern, secure way to manage application secrets in Azure. It allows for centralized management and rotation of secrets in the Key Vault, and your application will automatically pick up the new values on its next restart, without requiring a redeployment.

**Instructions:**
1.  Navigate to your **App Service** (e.g., `custom-tshirt-shop-backend`) in the Azure Portal.
2.  In the left menu, go to **Settings -> Configuration**.
3.  For each secret you want your application to use from Key Vault, add a new **Application setting**.
    -   **Name**: The name of the environment variable your application expects (e.g., `DATABASE`).
    -   **Value**: A special reference to the Key Vault secret in the format: `@Microsoft.KeyVault(SecretUri=your-secret-uri)`.
    -   You can get the `your-secret-uri` from the Key Vault by navigating to your **Key Vault** (`tshirt-shop-kv-prod`), clicking on the specific secret (e.g., `DATABASE`), and then clicking on the current version to copy its "Secret Identifier."
    -   **Example**: `@Microsoft.KeyVault(SecretUri=https://tshirt-shop-kv-prod.vault.azure.net/secrets/DATABASE/f8e...e9)`
4.  Add these references for all your secrets. This securely links your app's environment variables to Key Vault.

**Important**: If you omit the `@Microsoft.KeyVault(...)` syntax and paste the secret directly into the "Value" field, it will be stored as a plain-text environment variable. This is less secure and negates the primary benefits of using Key Vault, such as centralized management and dynamic secret rotation. The special reference syntax is what enables the secure fetching of secrets at runtime.

5.  **Configure Application Port**: Add an additional application setting to explicitly tell App Service which port your Node.js application is listening on.
    -   **Name**: `WEBSITES_PORT`
    -   **Value**: `8000` (This matches the `PORT` environment variable used by your Node.js backend).

### 3.2. Add a Health Check Endpoint
The application already has a `/health` endpoint. We need to configure App Service to use it.
1.  In your **App Service**, go to **Monitoring -> Health check**.
2.  Enable Health check.
3.  Set the **Path** to `/api/health` (assuming your routes are prefixed with `/api`).
4.  Save the configuration. App Service will now ping this endpoint to ensure your application is running correctly, which is crucial for the zero-downtime slot swap.

---

## Step 4: Create the GitHub Actions Workflow

Create a new file at `.github/workflows/deploy-azure-backend.yml` with the content provided in the next step. The provided workflow is flexible and will automatically handle both deployment methods:
-   **If a "staging" slot is detected**, it will perform a zero-downtime swap deployment.
-   **If no "staging" slot exists** (e.g., on a B1 plan), it will deploy directly to production with a brief restart.

## Final Checklist
- [ ] Azure Resource Group created.
- [ ] Azure App Service Plan and Web App created.
- [ ] Azure Key Vault created.
- [ ] App Service Managed Identity enabled and granted access to Key Vault.
- [ ] "staging" deployment slot created (Optional, for zero-downtime deployment).
- [ ] Secure OIDC connection configured between Azure and GitHub.
- [ ] `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID` added to GitHub secrets.
- [ ] All application secrets added to GitHub Secrets.
- [ ] App Service Configuration points to Key Vault secrets.
- [ ] App Service Health Check is configured.
- [ ] `deploy-azure-backend.yml` workflow file is created in the repository.

Once all these steps are completed, a push to the `main` branch will trigger the automated, zero-downtime deployment to Azure.

---

## Troubleshooting Common Deployment Errors

### Error: `Failed to resolve 'your-key-vault-name.vault.azure.net' ([Errno -2] Name or service not known)`
This error indicates that the GitHub Actions runner could not resolve the DNS name of your Azure Key Vault.

**Possible Causes & Solutions:**
1.  **Incorrect Key Vault Name**: The most common cause.
    *   **Verify**: Go to the Azure Portal, search for "Key Vaults," and confirm the exact name of your Key Vault.
    *   **Correct**: Ensure the `KEY_VAULT_NAME` environment variable in your `.github/workflows/deploy-azure-backend.yml` file **exactly** matches the name from the Azure Portal, including case.
2.  **Key Vault Not Created**: The Key Vault might not have been created in Azure yet, or it was deleted.
    *   **Verify**: Confirm the Key Vault exists in your Azure subscription.
3.  **DNS Propagation Delay**: Less common for existing resources, but if the Key Vault was just created, there might be a slight delay.
    *   **Wait**: Give it a few minutes and try running the workflow again.

### Error: `(Forbidden) Caller is not authorized to perform action on resource. Action: 'Microsoft.KeyVault/vaults/secrets/setSecret/action'`
This error means the Service Principal used by GitHub Actions does not have the necessary permissions to write (set) secrets in your Azure Key Vault.

**Possible Causes & Solutions:**
1.  **Incorrect Role Assignment**: The Service Principal might not have the correct role assigned, or the role assignment is not scoped correctly.
    *   **Verify**: Go to the Azure Portal, navigate to your **Key Vault**, then go to **Access control (IAM)**. Check the role assignments for the Service Principal (the Azure AD Application you created, e.g., `GitHubActions-TshirtShop`).
    *   **Correct**: Ensure the Service Principal has the **Key Vault Administrator** role assigned directly to the Key Vault resource. If you previously assigned "Contributor" to the resource group, you might need to add this more specific role.
    *   **Propagation Delay**: Role assignments can take a few minutes to propagate across Azure. If you just made the change, wait 5-10 minutes and try running the workflow again.

### Error: `:( Application Error` (or application fails to start)
This generic error indicates that your Node.js application failed to start or crashed shortly after deployment. This is often due to issues with environment variables, dependencies, or the application's startup command.

**Possible Causes & Solutions:**
1.  **Check Application Logs**: This is the most crucial step.
    *   **Enable Logging**: In the Azure Portal, navigate to your App Service. Go to **Monitoring -> App Service logs**. Enable "Application Logging (Filesystem)" and "Web server logging" (if not already enabled). Set the Retention Period to a few days.
    *   **Access Logs**: Go to **Monitoring -> Log stream** to see real-time logs, or use **Development Tools -> Advanced Tools (Kudu) -> Debug console -> CMD** and navigate to `LogFiles/Application` to download log files.
    *   **Interpret Logs**: Look for error messages related to:
        *   **Missing Environment Variables**: Your application might be trying to access an environment variable that isn't set or isn't correctly referenced from Key Vault.
        *   **Dependency Issues**: `npm install --production` might have failed, or there's a missing native dependency.
        *   **Startup Script Errors**: The `start` script in your `server/package.json` might have an issue.
6.  **Set Custom Startup Command**: Azure App Service sometimes has issues with `npm start` directly. To bypass this, set a custom startup command.
    *   In the Azure Portal, navigate to your App Service.
    *   Go to **Configuration -> General settings**.
    *   In the **Startup Command** field, enter: `node app.js`
    *   Save the change. This explicitly tells Azure how to start your application, bypassing any potential issues with `npm`'s internal paths.
2.  **Verify Key Vault References**:
    *   **Double-check**: Ensure all Key Vault references in your App Service **Configuration -> Application settings** are correctly formatted (`@Microsoft.KeyVault(SecretUri=your-secret-uri)`) and point to existing secrets.
    *   **Managed Identity**: Confirm the App Service's Managed Identity is enabled and has `Get` and `List` permissions on the Key Vault (as per Step 1.4).
3.  **`WEBSITES_PORT` Setting**:
    *   **Confirm**: Ensure you have the `WEBSITES_PORT` application setting configured to `8000` (as per Step 3.1, point 5).
4.  **Node.js Version**:
    *   **Verify**: Confirm that the Node.js version specified in your App Service runtime stack (e.g., Node 24 LTS) matches the `NODE_VERSION` in your GitHub Actions workflow (`24.x`).
5.  **Diagnose and Solve Problems**:
    *   In your App Service, go to **Diagnose and solve problems**. This tool can often automatically detect common issues and provide specific recommendations.

### Error: `TypeError: OAuth2Strategy requires a clientID option` (or similar for `clientSecret`, `FACEBOOK_APP_ID`, etc.)
This error indicates that an OAuth strategy (like Google or Facebook) in your `passport.js` configuration is not receiving its required `clientID` (or `clientSecret`, `FACEBOOK_APP_ID`, etc.) environment variable at runtime.

**Possible Causes & Solutions:**
1.  **Secret Not in Key Vault**: The corresponding secret might not have been successfully pushed to Azure Key Vault by the GitHub Actions workflow.
    *   **Verify**: Go to the Azure Portal, navigate to your **Key Vault** (`attars-backend-kv`), and check under **Secrets** to ensure that `GOOGLE-CLIENT-ID` (and `GOOGLE-CLIENT-SECRET`, `FACEBOOK-APP-ID`, `FACEBOOK-APP-SECRET` if applicable) exist and have values.
    *   **Action**: If missing, ensure these secrets are correctly added to your GitHub repository secrets and re-run the GitHub Actions workflow to push them to Key Vault.
2.  **App Service Configuration Reference Incorrect**: The App Service application setting might not be correctly referencing the Key Vault secret.
    *   **Verify**: In the Azure Portal, navigate to your **App Service** (`attars-backend`). Go to **Configuration -> Application settings**.
    *   **Check Entries**: Ensure you have application settings named `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`, and `FACEBOOK_APP_SECRET` (using underscores, as your Node.js app expects).
    *   **Check Values**: The value for each of these settings must be a Key Vault reference in the format: `@Microsoft.KeyVault(SecretUri=your-secret-uri)`. Double-check that the `your-secret-uri` part is correct and points to the right secret version in your Key Vault.
    *   **Example**: For `GOOGLE_CLIENT_ID`, the value should look like `@Microsoft.KeyVault(SecretUri=https://attars-backend-kv.vault.azure.net/secrets/GOOGLE-CLIENT-ID/f8e...e9)`.
3.  **Managed Identity Permissions**: The App Service's Managed Identity might not have `Get` and `List` permissions on the Key Vault.
    *   **Verify**: Re-verify **Step 1.4** in this guide to ensure the App Service's Managed Identity is enabled and has the "Key Vault Secrets User" role (or equivalent `Get`/`List` permissions) on the Key Vault.
4.  **Secret Name Mismatch (Key Vault vs. App Service)**: While Key Vault allows dashes in secret names (e.g., `GOOGLE-CLIENT-ID`), your Node.js application expects environment variables with underscores (e.g., `process.env.GOOGLE_CLIENT_ID`). The App Service application setting name should match what your app expects (`GOOGLE_CLIENT_ID`), and its value will be the Key Vault reference pointing to the secret (e.g., `GOOGLE-CLIENT-ID`).
    *   **Action**: Ensure the application setting names in App Service use underscores (`GOOGLE_CLIENT_ID`), even if the corresponding secret in Key Vault uses dashes (`GOOGLE-CLIENT-ID`).
