CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    author VARCHAR(255),
    title VARCHAR(255),
    isbn VARCHAR(255),
    image_url VARCHAR(255),
    description TEXT,
    bookshelf VARCHAR(255)
);

INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ('Dale Carnegie', 'How To Win Friends and Influence People', '726382728', 'https://i.imgur.com/J5LVHEL.jpg', 'This book is great, you should read it!', 'Nonfiction');

INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ('Beyonce''s Fans', 'Beyonce Will Rise Again', '7364838493', 'https://i.imgur.com/J5LVHEL.jpg', 'Beyonce lives. She is the true and living Gawd', 'The Gospel');