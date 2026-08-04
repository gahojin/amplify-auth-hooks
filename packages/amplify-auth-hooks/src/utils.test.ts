/*
 * Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * (C) 2026 GAHOJIN, Inc.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 */

import { describe, it } from 'vitest'
import { getTotpCodeURL } from './index.js'

const SECRET_KEY = 'shhhhh'
const USERNAME = 'username'

describe('getTotpCodeURL', () => {
  it('returns the expected value in the happy path', () => {
    const issuer = 'issuer'

    const customTotpCode = getTotpCodeURL(issuer, USERNAME, SECRET_KEY)

    expect(customTotpCode).toBe('otpauth://totp/issuer:username?secret=shhhhh&issuer=issuer')
  })
})
