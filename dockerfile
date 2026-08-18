# 1. Alap image
FROM node:26

# 2. Munkakönyvtár beállítása
WORKDIR /app

# 3. package.json + package-lock.json bemásolása
COPY package*.json ./

# 4. Függőségek telepítése
RUN npm install

# 5. Projekt másolása
COPY . .

# 6. Port megnyitása
EXPOSE 5007

# 7. App indítása
CMD ["npm", "start"]
