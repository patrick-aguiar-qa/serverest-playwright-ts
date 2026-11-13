export interface NewUser {
  nome: string;
  email: string;
  password: string;
  administrador: 'true' | 'false';
}

export interface User extends NewUser {
  _id: string;
}

export interface NewProduct {
  nome: string;
  preco: number;
  descricao: string;
  quantidade: number;
}

export interface Product extends NewProduct {
  _id: string;
}

export interface CartItem {
  idProduto: string;
  quantidade: number;
}

export interface MessageBody {
  message: string;
}

export interface LoginBody extends MessageBody {
  authorization: string;
}

export interface CreatedBody extends MessageBody {
  _id: string;
}

export interface ProductListBody {
  quantidade: number;
  produtos: Product[];
}

export interface UserListBody {
  quantidade: number;
  usuarios: User[];
}
