import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import { favoritesReducer } from "@/store/favoritesSlice";
import { moviesReducer } from "@/store/moviesSlice";
import { rootSaga } from "@/store/sagas";

export function makeStore() {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: {
      favorites: favoritesReducer,
      movies: moviesReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(sagaMiddleware),
  });

  sagaMiddleware.run(rootSaga);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
