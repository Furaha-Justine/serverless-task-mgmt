
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { cognitoConfig } from "../cognitoConfig";

const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.userPoolId,
  ClientId:   cognitoConfig.clientId,
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);  
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) { setLoading(false); return; }

    cognitoUser.getSession((err, session) => {
      if (err || !session.isValid()) { setLoading(false); return; }
      hydrateUser(session);
      setLoading(false);
    });
  }, []);

  function hydrateUser(session) {
    const idToken = session.getIdToken();
    const payload = idToken.decodePayload();
    const groups  = payload["cognito:groups"] || [];
    setUser({
      userId:   payload.sub,
      email:    payload.email,
      groups,
      isAdmin:  groups.includes("Admins"),
      isMember: groups.includes("Members"),
      idToken:  idToken.getJwtToken(),
    });
  }

  async function login(email, password) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess(session) {
          hydrateUser(session);
          resolve();
        },
        onFailure(err) {
          reject(err);
        },
        newPasswordRequired() {
          reject(new Error("Password reset required. Contact your administrator."));
        },
      });
    });
  }

  async function signup(email, password, name) {
    return new Promise((resolve, reject) => {
      const attrs = [
        new CognitoUserAttribute({ Name: "email", Value: email }),
        new CognitoUserAttribute({ Name: "name",  Value: name }),
      ];
      userPool.signUp(email, password, attrs, null, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  async function confirmSignup(email, code) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  function logout() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) cognitoUser.signOut();
    setUser(null);
  }

  // Refresh token and return current id token for API calls
  async function getIdToken() {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) return reject(new Error("Not authenticated"));
      cognitoUser.getSession((err, session) => {
        if (err) return reject(err);
        resolve(session.getIdToken().getJwtToken());
      });
    });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, confirmSignup, logout, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
