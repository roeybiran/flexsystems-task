# Technical Test – React Developer

Dear Candidate,

You are about to take an exam that simulates a significant portion of the requirements you will need to fulfill in a development position at our company.

## Task

You are required to build a website that displays movies.

## Instructions

Visit the website: [https://www.themoviedb.org/](https://www.themoviedb.org/)

The site offers an API at: [https://www.themoviedb.org/documentation/api](https://www.themoviedb.org/documentation/api)

Create a new website that can perform the following actions:

- Display all popular movies on the homepage.
- Provide an option to filter results by **Popular**, **Airing Now**, and **My Favorites**.
- Include an input field for movie search.
- Add pagination for **Popular** and **Airing Now**.
- Selecting or clicking a movie should open a separate page (not a new tab) displaying the movie details.
- On the movie details page, include an option to add the movie to favorites.
- You may use `localStorage` for this; there is no need to use an external API.
- All site navigation, including scrolling, must be done using the keyboard (arrow keys, Enter, and Escape).
- The Tab key should not perform any action on the page.
- Regarding the search input:
  - A search request should only be sent if there are at least **2 characters**.
  - A request should only be sent if the user has not typed a character in the last **500 ms**.
- All search requests must be rate-limited to up to **5 requests per 10 seconds**.
- Disable mouse scrolling (via overflow).
- Display the content with **4 cards per row**, and enable scrolling through keyboard navigation.
- While navigating between categories (**Popular / Airing Now**), the request should be sent:
  - On focus (after **2 seconds**), or
  - Immediately on click.

## Highlights

- Use **React + Redux-Saga**.

Pay special attention to the following topics:

- Coding principles
- Naming conventions
- Readability
- Error handling (timeouts, missing or incorrect fields)
- Number of renders
- Efficiency of data loading from the API
- Overall application loading speed

Upon completion, create a GitHub repository and push the necessary files.

Good luck!
