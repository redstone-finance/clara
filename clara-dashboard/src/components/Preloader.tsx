import {Component} from "solid-js";

export const Preloader: Component = () => {
    return (
        <div class="d-flex justify-content-center align-items-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    );
};
