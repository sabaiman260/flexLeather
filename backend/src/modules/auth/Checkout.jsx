import React, { useState, useEffect } from 'react';
import { useAuth } from '../../backend/src/modules/auth/AuthContext'; // Adjust this import path to your project structure

const CheckoutPage = () => {
    const { user, isLoggedIn } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        shippingAddress: '',
    });

    // This effect runs when the component loads or when the user's login state changes.
    // It populates the form if a logged-in user is detected.
    useEffect(() => {
        if (isLoggedIn && user) {
            setFormData({
                fullName: user.userName || '',
                email: user.userEmail || '',
                phoneNumber: user.phoneNumber || '',
                shippingAddress: user.userAddress || '',
            });
        } else {
            // If the user logs out while on the page, clear the form.
            setFormData({
                fullName: '',
                email: '',
                phoneNumber: '',
                shippingAddress: '',
            });
        }
    }, [isLoggedIn, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Your order submission logic here...
        console.log('Submitting order with data:', formData);
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
            <h2>Shipping Information</h2>
            {isLoggedIn && <p>Your details have been pre-filled. You can edit them below.</p>}
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" required />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required />
            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number" />
            <textarea name="shippingAddress" value={formData.shippingAddress} onChange={handleChange} placeholder="Shipping Address" required></textarea>
            <button type="submit">Place Order</button>
        </form>
    );
};

export default CheckoutPage;