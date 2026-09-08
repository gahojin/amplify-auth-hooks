# amplify-auth-hooks

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![NPM Version](https://img.shields.io/npm/v/%40gahojin-inc%2Famplify-auth-hooks?activeTab=versions)](https://www.npmjs.com/package/@gahojin-inc/amplify-auth-hooks)

Amplify AuthのためのReact Hooks

## 使い方
 
```shell
npm install @gahojin-inc/amplify-auth-hooks
```

### サインインフローの構築
 
`AuthenticatorProvider` でラップし、`useAuthenticator` で現在の認証状態(`route`)に応じた画面を出し分けます。
 
```tsx
import { AuthenticatorProvider, useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
 
const Router = () => {
  const { route } = useAuthenticator(({ route }) => [route])
 
  switch (route) {
    case 'signIn':
      return <SignIn />
    case 'signUp':
      return <SignUp />
    case 'authenticated':
      return <Home />
    // confirmSignIn, confirmSignUp, forgotPassword, setupTotp など
    // その他のrouteについても同様に画面を切り替える
    default:
      return null
  }
}
 
const App = () => (
  <AuthenticatorProvider>
    <Router />
  </AuthenticatorProvider>
)
```
 
各画面では `useAuthenticator` から取得できる `handleSubmit` や `setRoute` を使って、サインイン処理や画面遷移を行います。
 
`route` は以下のいずれかを取ります。
 
- `idle` / `setup` / `transition` — 初期化中
- `signIn` / `signUp` — サインイン・サインアップ画面
- `confirmSignIn` / `confirmSignUp` — 確認コード入力画面
- `forceNewPassword` — 初回サインイン時のパスワード変更
- `forgotPassword` / `confirmResetPassword` — パスワードリセット
- `selectMfaType` / `setupEmail` / `setupTotp` — MFA設定
- `verifyUser` / `confirmVerifyUser` — ユーザー属性の確認
- `authenticated` — 認証済み
- `signOut` — サインアウト処理中

```tsx
import { useAuthenticator } from '@gahojin-inc/amplify-auth-hooks'
import { useState } from 'react'
 
const SignIn = () => {
  const { isPending, handleSubmit, setRoute } = useAuthenticator(({ isPending }) => [isPending])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
 
  return (
    <form>
      <input value={username} onChange={(e) => setUsername(e.target.value)} disabled={isPending} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isPending} />
      <button type="button" onClick={() => handleSubmit({ username, password })} disabled={isPending}>
        signIn
      </button>
      <button type="button" onClick={() => setRoute('signUp')} disabled={isPending}>
        signUp
      </button>
    </form>
  )
}
```
 
### 認証ユーザーの取得
 
```tsx
import { useAuth } from '@gahojin-inc/amplify-auth-hooks'
 
const Profile = () => {
  const { user, isLoading, error } = useAuth()
 
  if (isLoading) return <p>loading...</p>
  if (error) return <p>{error.message}</p>
  return <p>{user?.username}</p>
}
```

## ライセンス

[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

```
Copyright 2025, GAHOJIN, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
