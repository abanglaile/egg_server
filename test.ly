\version "2.18.2"
#(set! paper-alist (cons '("my size" . (cons (* 48 mm) (* 12 mm))) paper-alist))

\header { 
  tagline = ""  % removed 
} 

\paper {
  #(set-paper-size "my size")
}

{
	\time 3/4
	\clef bass
	c4 c g g a
}