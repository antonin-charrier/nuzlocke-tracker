import { FirestoreDataConverter } from 'firebase/firestore';

export interface Pokemon {
  uid: string;
  id: number;
  level: number;
  name: string;
  evolutions: { id: number, name: string }[];
  gender: 'male' | 'female' | 'none';
}

export class Pokemon implements Pokemon {
  constructor(init?: Partial<Pokemon>) {
    Object.assign(this, init);
  }
}

export const pokemonConverter: FirestoreDataConverter<Pokemon> = {
  toFirestore: (pokemon: Pokemon) => ({
    id: pokemon.id,
    level: pokemon.level,
    gender: pokemon.gender,
    name: pokemon.name
  }),
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return new Pokemon({
      uid: snapshot.id,
      id: data.id,
      level: data.level,
      gender: data.gender,
      name: data.name
    });
  }
};

