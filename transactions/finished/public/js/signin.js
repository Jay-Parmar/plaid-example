import {
  callMyServer,
  showSelector,
  hideSelector,
  resetUI,
  humanReadableCategory,
  currencyAmount
} from "./utils.js";
import { refreshConnectedBanks, clientRefresh } from "./client.js";
/**
 * Methods to handle signing in and creating new users. Because this is just
 * a sample, we decided to skip the whole "creating a password" thing.
 */

export const createNewUser = async function () {
  const newUsername = document.querySelector("#username").value;
  await callMyServer("/server/users/create", true, {
    username: newUsername,
  });
  await refreshSignInStatus();
};

/**
 * Get a list of all of our users on the server.
 */
const getExistingUsers = async function () {
  const usersList = await callMyServer("/server/users/list");
  if (usersList.length === 0) {
    hideSelector("#existingUsers");
  } else {
    showSelector("#existingUsers");
    document.querySelector("#existingUsersSelect").innerHTML = usersList.map(
      (userObj) => `<option value="${userObj.id}">${userObj.username}</option>`
    );
  }
};

export const signIn = async function () {
  const userId = document.querySelector("#existingUsersSelect").value;
  await callMyServer("/server/users/sign_in", true, { userId: userId });
  await refreshSignInStatus();
};

export const signOut = async function () {
  await callMyServer("/server/users/sign_out", true);
  await refreshSignInStatus();
  resetUI();
};

const getFilterData = async function () {
  const all_data = await callMyServer("/server/users/get_filter_data");
  console.log(":::all data", all_data);
  document.querySelector("#user-filter").innerHTML = all_data.filterInfo.users.map(
    (userObj) => `<option value="${userObj.id}">${userObj.username}</option>`
  );
  document.querySelector("#category-filter").innerHTML = all_data.filterInfo.categories.map(
    (category) => `<option value="${category.category}">${category.category}</option>`
  );
  document.querySelector("#bank-filter").innerHTML = all_data.filterInfo.banks.map(
    (bank) => `<option value="${bank.bank_name}">${bank.bank_name}</option>`
  );
}

const showTransactionDataForAdmin = (txnData) => {
  console.log(":::transactin", txnData);
  const tableRows = txnData.map((txnObj) => {
    return `<tr>
    <td>${txnObj.username}</td>
    <td>${txnObj.date}</td>
    <td>${txnObj.name}</td>
    <td>${humanReadableCategory(txnObj.category)}</td>
    <td>${txnObj.bank_name}</td>
    <td class="text-end">${currencyAmount(
      txnObj.amount,
      txnObj.currency_code
    )}</td>
    <td>${txnObj.bank_name}<br/>${txnObj.account_name}</td>
    </tr>`;
  });
  // WARNING: Not really safe without some proper sanitization
  document.querySelector("#adminTxnTable").innerHTML = tableRows.join("\n");
};


export const filterData = async function () {
  const userIds = Array.from(document.querySelector("#user-filter").selectedOptions).map(option => option.value);
  const categories = Array.from(document.querySelector("#category-filter").selectedOptions).map(option => option.value);
  const banks = Array.from(document.querySelector("#bank-filter").selectedOptions).map(option => option.value);
  console.log(userIds, categories, banks);
  // const postData = {
  //   userIds: Array.length(userIds) ? banks : null,
  //   categories: Array.length(categories) ? banks : null,
  //   banks: Array.length(banks) ? banks : null,
  // };
  const postData = {
    userIds: userIds,
    categories: categories,
    banks: banks,
  };
  const new_data = await callMyServer("/server/transactions/list_all", true, postData);
  showTransactionDataForAdmin(new_data);
}

export const refreshSignInStatus = async function () {
  const userInfoObj = await callMyServer("/server/users/get_my_info");
  const userInfo = userInfoObj.userInfo;
  if (userInfo == null) {
    showSelector("#notSignedIn");
    hideSelector("#signedIn");
    getExistingUsers();
  } else {
    showSelector("#signedIn");
    hideSelector("#notSignedIn");
    if (userInfo.isAdmin) {
      await getFilterData();
      showSelector("#isAdmin");
      hideSelector("#isNotAdmin");
    } else {
      showSelector("#isNotAdmin");
      hideSelector("#isAdmin");
    }
    document.querySelector("#welcomeMessage").textContent = `Signed in as ${
      userInfo.username
    } (user ID #${userInfo.id.substr(0, 8)}...)`;
    await refreshConnectedBanks();

    await clientRefresh();
  }
};
