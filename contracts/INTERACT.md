cast call 0x1eC31C737BA41e915CD133a942AFF5F11e52fA97 "owner()(address)" \
  --rpc-url https://mainnet.base.org

source .env && cast send 0x1eC31C737BA41e915CD133a942AFF5F11e52fA97 \
  "transferOwnership(address)" \
  0x37E2619161ACe4149FD9366F30846DB909bd2A07 \
  --rpc-url https://mainnet.base.org \
  --private-key ${PRIVATE_KEY}
