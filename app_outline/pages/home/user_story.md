# Home page - `/`

## On this page

- Sign-Up (Enter Email Address, Click Sign-Up button)
    - Modal (Enter a Password for your Account, Confirm the Password)
- Sign-In (Click Sign-In button)
    - Modal (Enter your Email, Enter your Password, Click Sign-Up button (within the modal, under password field))

## States

- **Empty:** Before an email is entered into the Email field, it should simply say, 'Enter your Email Address'

## Done when

- [x] Entering an Email Address and clicking 'Sign-Up' button opens a Modal with an Email, Password, and Confirm Password field, with the Email address pre-filled from the previous entry.
- [x] The user enters an identical password twice and clicks the new 'Sign-Up' button within the Modal and is then taken to the 'Selection' page.
- [x] A returning user clicks the 'Sign-In' button, a modal pops up for them to enter their Email address and Password, clicks the 'Sign-In' button within the modal, and is taken to the 'Selection' page
    - For this test, we can make a default user of Adam@gmail.com with password S3cur30n3@# since we will not have an API or backend, this will allow us to test the sign-in feature.