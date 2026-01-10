import React from 'react';

const SecretField = ({ value, setter }) => {
    return (
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
            <label htmlFor="website_url">Website</label>
            <input
                id="website_url"
                type="text"
                value={value}
                onChange={e => setter(e.target.value)}
                tabIndex="-1"
                autoComplete="off"
            />
        </div>
    );
};

export default SecretField;
